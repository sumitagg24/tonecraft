import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook-dedupe";

/**
 * POST /api/webhooks/dodo — receive Dodo Payments webhook events.
 * Matches the URL configured in the Dodo dashboard:
 * https://tonecraft.site/api/webhooks/dodo
 *
 * Dodo webhook payloads are wrapped in an envelope:
 *   { type: "subscription.active", business_id, timestamp, data: <Subscription|Payment> }
 * All resource fields (subscription_id, customer, product_id, metadata…) live
 * under `data` — NOT at the top level. Handlers below therefore normalize with
 * `unwrap()` before reading fields. This was the root cause of subscriptions
 * never syncing after a successful payment (fields read as undefined).
 */

type Raw = Record<string, unknown>;

/** Return the inner resource (`data`) when present, else the payload itself. */
function unwrap(payload: Raw): Raw {
  const d = payload.data;
  if (d && typeof d === "object" && !Array.isArray(d)) return d as Raw;
  return payload;
}

function asRecord(v: unknown): Raw | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function firstRecord(...candidates: unknown[]): Raw | null {
  for (const c of candidates) {
    const r = asRecord(c);
    if (r) return r;
  }
  return null;
}

/** Event identifier used for webhook replay dedupe + processed marking. */
function eventIdOf(payload: Raw): string {
  const sub = unwrap(payload);
  return (
    asString(sub.subscription_id) ||
    asString(sub.payment_id) ||
    asString(payload.subscription_id) ||
    asString(payload.payment_id) ||
    ""
  );
}

async function markProcessed(payload: Raw) {
  const eventId = eventIdOf(payload);
  if (eventId) {
    try {
      await markWebhookProcessed("dodo", eventId);
    } catch (err) {
      logger.error("Failed to mark webhook processed", { error: String(err) });
    }
  }
}

const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
if (!webhookKey) {
  throw new Error(
    "DODO_PAYMENTS_WEBHOOK_KEY is not configured. " +
    "Webhook verification cannot proceed without it."
  );
}

export const POST = Webhooks({
  webhookKey,
  onPayload: async (payload) => {
    const p = payload as Raw;
    const eventId = eventIdOf(p);

    const claim = eventId
      ? await claimWebhookEvent("dodo", eventId, asString(p.type))
      : "new";
    if (claim === "duplicate") {
      logger.info("Dodo webhook replay skipped", { eventId, type: p.type });
      return;
    }

    logger.info("Dodo webhook received", { type: p.type, eventId });
    void auditLogService.record("billing.webhook_received", "billing", {
      metadata: { eventType: p.type, provider: "dodo" },
    });

    // Note: markWebhookProcessed is called AFTER event handlers succeed
    // to ensure the event is actually processed before marking as done.
  },

  onPaymentSucceeded: async (payload) => {
    const p = payload as Raw;
    logger.info("Dodo payment succeeded", { paymentId: eventIdOf(p) });
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onPaymentFailed: async (payload) => {
    const p = payload as Raw;
    logger.warn("Dodo payment failed", { paymentId: eventIdOf(p) });
    // Sync subscription to past_due so the access gate shows the right state.
    // Also mark processed — without this, failed-payment events would be
    // retried indefinitely, flooding the logs.
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionActive: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionCancelled: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "canceled");
    await markProcessed(p);
  },

  onSubscriptionOnHold: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionPaused: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "paused");
    await markProcessed(p);
  },

  onSubscriptionUnpaused: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionRenewed: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionPlanChanged: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionFailed: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionExpired: async (payload) => {
    const p = payload as Raw;
    await syncSubscriptionFromDodo(p, "canceled");
    await markProcessed(p);
  },
});

// ── Subscription sync ────────────────────────────────────────────────────

function planFromProductId(productId: string): string {
  const BASIC = process.env.DODO_PRODUCT_BASIC || "";
  const PRO = process.env.DODO_PRODUCT_PRO || "";
  const ADVANCED = process.env.DODO_PRODUCT_ADVANCED || "";
  // Annual variants bill yearly but grant the same plan — without them a
  // yearly purchase would resolve to "" and silently sync the user to Free.
  const BASIC_ANNUAL = process.env.DODO_PRODUCT_BASIC_ANNUAL || "";
  const PRO_ANNUAL = process.env.DODO_PRODUCT_PRO_ANNUAL || "";
  const ADVANCED_ANNUAL = process.env.DODO_PRODUCT_ADVANCED_ANNUAL || "";
  if (productId === PRO || productId === PRO_ANNUAL) return "pro";
  if (productId === BASIC || productId === BASIC_ANNUAL) return "basic";
  if (productId === ADVANCED || productId === ADVANCED_ANNUAL) return "enterprise";
  return "";
}

function toDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function syncSubscriptionFromDodo(
  payload: Raw,
  status: string,
) {
  // Dodo wraps the resource under `data` — normalize once, then read fields.
  const sub = unwrap(payload);
  const customer = firstRecord(sub.customer);
  const metadata = firstRecord(payload.metadata, sub.metadata, sub.custom_data, customer?.metadata);

  let userId =
    asString(metadata?.userId) || asString(metadata?.user_id) || "";
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
    userId = user?.id ?? "";
  }

  if (!userId) {
    logger.warn("No userId or matching email in Dodo webhook", {
      type: asString(payload.type),
      eventId: eventIdOf(payload),
      hasEmail: Boolean(email),
    });
    return;
  }

  const subscriptionId =
    asString(sub.subscription_id) || asString(payload.subscription_id) || "";
  const customerId =
    asString(customer?.customer_id) ||
    asString(sub.customer_id) ||
    asString(payload.customer_id) ||
    "";
  // Subscription resources carry a flat `product_id` (Dodo's product = our
  // plan). Payment events don't include it — keep the existing plan then.
  const productId =
    asString(sub.product_id) ||
    asString(firstRecord(sub.product)?.product_id) ||
    "";

  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  const resolvedPlan = productId
    ? planFromProductId(productId) || existing?.plan || "free"
    : existing?.plan || "free";

  const cancelAtPeriodEnd =
    status === "canceled" ||
    (typeof sub.cancel_at_next_billing_date === "boolean"
      ? (sub.cancel_at_next_billing_date as boolean)
      : false);

  // Billing-period windows keep UsageGuard's credit reset in sync with the
  // subscription (see UsageGuard.periodChanged).
  const periodStart =
    toDate(sub.previous_billing_date) || toDate(sub.created_at);
  const periodEnd = toDate(sub.next_billing_date);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: "dodo",
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

  logger.info("Dodo subscription synced", {
    userId,
    plan: resolvedPlan,
    status,
    subscriptionId,
    customerId,
  });

  void auditLogService.record("billing.subscribe", "subscription", {
    actorId: userId,
    resourceId: subscriptionId,
    metadata: { plan: resolvedPlan, status, provider: "dodo" },
  });

  void planService.invalidateCache(userId);
}
