import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { grantForProductId } from "@/billing/dodoProducts";

/**
 * Dodo webhook payload helpers + subscription sync.
 *
 * The @dodopayments SDK verifies the signature and parses the envelope:
 *   { type: "subscription.active", business_id, timestamp, data: <resource> }
 * All resource fields (subscription_id, customer, product_id, metadata …) live
 * under `data` — handlers normalize with `unwrap()` before reading fields.
 */

export type Raw = Record<string, unknown>;

/** Return the inner resource (`data`) when present, else the payload itself. */
export function unwrap(payload: Raw): Raw {
  const d = payload.data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as Raw;
  return payload;
}

export function asRecord(v: unknown): Raw | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null;
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function firstRecord(...candidates: unknown[]): Raw | null {
  for (const c of candidates) {
    const r = asRecord(c);
    if (r) return r;
  }
  return null;
}

export function toDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Unique, stable identifier for webhook replay dedupe.
 *
 * CRITICAL: the key MUST be unique per (event type, resource). Dodo Payment
 * resources also carry `subscription_id`, so using the bare subscription id
 * would make `payment.succeeded`, `subscription.active`, `subscription.renewed`
 * and `subscription.cancelled` all collide — only the first event for a
 * subscription would ever be processed and renewals/cancellations would be
 * dropped as "replays". Prefixing the event type (and preferring the payment
 * id for payment events) keeps every event independently processable while
 * still deduping true redeliveries of the same event.
 */
export function eventIdOf(payload: Raw): string {
  const type = asString(payload.type) || "unknown";
  const sub = unwrap(payload);
  const resourceId =
    asString(sub.payment_id) ||
    asString(payload.payment_id) ||
    asString(sub.subscription_id) ||
    asString(payload.subscription_id) ||
    "";
  return resourceId ? `${type}:${resourceId}` : "";
}

/**
 * The Dodo product id referenced by a webhook resource. Subscription
 * resources carry a flat `product_id`; Payment resources don't, but their
 * `product_cart` (one entry per purchased product) does. Falling back to the
 * cart lets `payment.succeeded` events resolve the plan for first-time
 * subscribers instead of stamping `free`.
 */
export function resolveProductId(sub: Raw): string {
  const direct = asString(sub.product_id);
  if (direct) return direct;

  const nested = firstRecord(sub.product);
  if (nested) {
    const pid = asString(nested.product_id);
    if (pid) return pid;
  }

  const cart = sub.product_cart;
  if (Array.isArray(cart)) {
    for (const item of cart) {
      const r = asRecord(item);
      const pid = r ? asString(r.product_id) : "";
      if (pid) return pid;
    }
  }
  return "";
}

/** Map a Dodo product id to the plan it grants (mirrors checkout resolution). */
export function planFromProductId(productId: string): string {
  return grantForProductId(productId) || '';
}

export async function syncSubscriptionFromDodo(
  payload: Raw,
  status: string,
  opts: SyncOptions = {},
) {
  const sub = unwrap(payload);
  const customer = firstRecord(sub.customer);
  const metadata = firstRecord(
    payload.metadata,
    sub.metadata,
    sub.custom_data,
    customer?.metadata,
  );

  let userId =
    asString(metadata?.userId) || asString(metadata?.user_id) || '';
  const email =
    asString(customer?.email) || asString(sub.email) || asString(payload.email);

  if (!userId && email) {
    // Fallback: checkout always carries the user's email; some events (e.g.
    // renewal payments) may not echo the session metadata back, so resolve
    // the account by email instead of dropping the event.
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    userId = user?.id ?? '';
  }

  if (!userId) {
    logger.warn('No userId or matching email in Dodo webhook', {
      type: asString(payload.type),
      eventId: eventIdOf(payload),
      hasEmail: Boolean(email),
    });
    return;
  }

  const subscriptionId =
    asString(sub.subscription_id) || asString(payload.subscription_id) || '';
  const customerId =
    asString(customer?.customer_id) ||
    asString(sub.customer_id) ||
    asString(payload.customer_id) ||
    '';
  const productId = resolveProductId(sub);

  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });

  const mappedPlan = productId ? planFromProductId(productId) : '';
  let resolvedPlan = mappedPlan || existing?.plan || '';

  // A payment event that can't identify the product must not create an
  // 'active + free' subscription for a customer who just paid — defer to the
  // subscription.* events which carry the authoritative product id.
  if (!resolvedPlan && !existing && opts.createOnlyWhenPlanKnown) {
    logger.warn('Deferring Dodo subscription create: plan unknown', {
      type: asString(payload.type),
      eventId: eventIdOf(payload),
      userId,
    });
    return;
  }
  if (!resolvedPlan) resolvedPlan = 'free';

  const cancelAtPeriodEnd =
    status === 'canceled' ||
    (typeof sub.cancel_at_next_billing_date === 'boolean'
      ? (sub.cancel_at_next_billing_date as boolean)
      : false);

  // Billing-period windows keep UsageGuard's credit reset in sync with the
  // subscription (see UsageGuard.periodChanged).
  const periodStart = toDate(sub.previous_billing_date) || toDate(sub.created_at);
  const periodEnd = toDate(sub.next_billing_date);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: 'dodo',
      providerSubscriptionId: subscriptionId,
      providerCustomerId: customerId,
      providerPriceId: productId,
      status,
      plan: resolvedPlan,
      cancelAtPeriodEnd,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      providerSubscriptionId: subscriptionId || undefined,
      providerCustomerId: customerId || undefined,
      providerPriceId: productId || undefined,
      status,
      plan: resolvedPlan,
      cancelAtPeriodEnd,
      currentPeriodStart: periodStart ?? undefined,
      currentPeriodEnd: periodEnd ?? undefined,
      scheduledChange: null,
    },
  });

  logger.info('Dodo subscription synced', {
    userId,
    plan: resolvedPlan,
    status,
    subscriptionId,
    customerId,
  });

  void auditLogService.record('billing.subscribe', 'subscription', {
    actorId: userId,
    resourceId: subscriptionId,
    metadata: { plan: resolvedPlan, status, provider: 'dodo' },
  });

  void planService.invalidateCache(userId);
}

export interface SyncOptions {
  /**
   * Only create a Subscription row when the plan is known. Payment events
   * for a brand-new customer carry no flat product id and (in edge cases) no
   * product_cart either — creating an `active` + `free` row would pre-
   * empt the authoritative `subscription.active` event and, combined with replay
   * dedupe, could pin the customer to Free indefinitely. Subscription events
   * keep the old behavior (they always carry a product id).
   */
  createOnlyWhenPlanKnown?: boolean;
}

