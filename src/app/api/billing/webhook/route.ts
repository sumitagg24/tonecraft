import { NextResponse } from "next/server";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { getPriceId } from "@/lib/billing-prices";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook-dedupe";
import { extractClientIp, isIpFromPaddle } from "@/lib/webhook-ip-allowlist";

export async function POST(req: Request) {
  // ── IP allowlist ─────────────────────────────────────────────────────────
  // Defense-in-depth: only accept webhooks from Paddle's published IPs.
  // Signature verification is the primary gate; IP check catches tampered
  // requests early before crypto verification.
  const clientIp = extractClientIp(req.headers);
  const ipAllowed = await isIpFromPaddle(clientIp);
  if (!ipAllowed) {
    logger.warn("Webhook rejected: IP not in Paddle allowlist", { ip: clientIp });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Pre-validation ───────────────────────────────────────────────────────
  // A request with no signature header or empty body can't be verified.
  const signature = req.headers.get("paddle-signature") ?? "";
  const body = await req.text();

  if (!signature || !body) {
    return NextResponse.json(
      { error: "Missing signature or body" },
      { status: 400 },
    );
  }

  // ── Signature verification ───────────────────────────────────────────────
  let event: unknown;
  try {
    event = await billingService.verifyWebhook({
      body,
      headers: { "paddle-signature": signature },
    });
  } catch (err) {
    logger.warn("Webhook verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const normalized = await billingService.handleWebhookEvent(event);

  // Replay protection: skip events we've already processed (Paddle redelivers
  // on 5xx/network failures and supports manual replays from the dashboard).
  const rawEvent = event as { event_id?: string; eventId?: string };
  const eventId = rawEvent.eventId ?? rawEvent.event_id;
  const claim = eventId
    ? await claimWebhookEvent("paddle", eventId, normalized.type)
    : "new";
  if (claim === "duplicate") {
    logger.info("Webhook replay skipped (already processed)", { eventId, type: normalized.type });
    return NextResponse.json({ received: true, deduplicated: true });
  }

  logger.info("Webhook received", { type: normalized.type, claim });
  // Only record events we actually act on — ignored ones (product.*, customer.*,
  // transaction.created, …) would otherwise spam the audit log.
  if (normalized.type !== "ignored") {
    void auditLogService.record("billing.webhook_received", "billing", {
      metadata: { eventType: normalized.type },
    });
  }

  // ── Process event ────────────────────────────────────────────────────────
  try {
    await processEvent(normalized);
    if (eventId) await markWebhookProcessed("paddle", eventId);
  } catch (err) {
    logger.error("Webhook sync failed", {
      type: normalized.type,
      error: String(err),
    });
  }

  // Acknowledge fast. Heavy work (emails, PDFs, third-party APIs) belongs
  // in a queue — the 5-second timeout is real.
  return NextResponse.json({ received: true });
}

// ── Event routing ─────────────────────────────────────────────────────────

async function processEvent(normalized: {
  type: string;
  data: Record<string, unknown>;
}) {
  switch (normalized.type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.cancelled":
    case "subscription.paused":
    case "subscription.payment_succeeded":
    case "subscription.payment_failed":
      return syncSubscription(normalized);
    case "customer.created":
    case "customer.updated":
      return syncCustomer(normalized);
    default:
      logger.debug("Ignoring unmapped webhook event", { type: normalized.type });
      return;
  }
}

// ── Customer sync ─────────────────────────────────────────────────────────

async function syncCustomer(normalized: {
  type: string;
  data: Record<string, unknown>;
}) {
  const data = normalized.data as {
    id?: string;
    email?: string;
    name?: string;
  };
  const customerId = data.id;
  const email = data.email;

  if (!customerId || !email) {
    logger.warn("Customer event missing id or email", {
      type: normalized.type,
      customerId,
    });
    return;
  }

  logger.info("Customer event received", {
    type: normalized.type,
    customerId,
    email,
  });

  void auditLogService.record("billing.webhook_received", "billing", {
    metadata: { eventType: normalized.type, customerId },
  });
}

// The Paddle SDK normalizes webhook payloads to camelCase (customData,
// customerId, currentBillingPeriod…), so both shapes must be read here —
// otherwise sync silently skips every event ("No userId in webhook data").
interface PaddleData {
  id?: string;
  customer_id?: string;
  customerId?: string;
  status?: string;
  items?: { price?: { id?: string } }[];
  current_billing_period?: { starts_at?: string; ends_at?: string };
  currentBillingPeriod?: { startsAt?: string; endsAt?: string };
  canceled_at?: string | null;
  canceledAt?: string | null;
  scheduled_change?: { action?: string; effective_at?: string } | null;
  scheduledChange?: { action?: string; effectiveAt?: string } | null;
  custom_data?: Record<string, string>;
  customData?: Record<string, string>;
  // Customer event fields
  email?: string;
  name?: string;
}

function extractUserId(data: PaddleData): string | null {
  return (
    data.customData?.userId ??
    data.customData?.user_id ??
    data.custom_data?.userId ??
    data.custom_data?.user_id ??
    null
  );
}

async function syncSubscription(normalized: { type: string; data: Record<string, unknown> }) {
  // Events we don't act on (see PaddleProvider.mapEventType) are safe no-ops.
  if (normalized.type === "ignored") {
    return;
  }
  const data = normalized.data as PaddleData;
  const userId = extractUserId(data);
  if (!userId) {
    logger.warn("No userId in webhook data, skipping sync");
    return;
  }

  const subscriptionId = data.id;
  const priceId = data.items?.[0]?.price?.id ?? null;
  const periodStart = data.currentBillingPeriod?.startsAt
    ? new Date(data.currentBillingPeriod.startsAt)
    : data.current_billing_period?.starts_at
      ? new Date(data.current_billing_period.starts_at)
      : null;
  const periodEnd = data.currentBillingPeriod?.endsAt
    ? new Date(data.currentBillingPeriod.endsAt)
    : data.current_billing_period?.ends_at
      ? new Date(data.current_billing_period.ends_at)
      : null;
  const customerId = data.customerId ?? data.customer_id ?? null;
  const isCanceled = !!(data.canceledAt ?? data.canceled_at);

  // Track scheduled changes (cancel/pause effective at end of period).
  // scheduledChange is non-null when a user cancels or pauses mid-period.
  const scheduledChangeData = data.scheduledChange ?? data.scheduled_change;
  const scheduledChangeAction = scheduledChangeData?.action;
  const scheduledChangeEffectiveAt =
    scheduledChangeData && "effectiveAt" in scheduledChangeData
      ? scheduledChangeData.effectiveAt
      : scheduledChangeData && "effective_at" in scheduledChangeData
        ? scheduledChangeData.effective_at
        : null;
  const scheduledChangeAt = scheduledChangeEffectiveAt
    ? new Date(scheduledChangeEffectiveAt)
    : null;

  switch (normalized.type) {
    case "subscription.created":
    case "subscription.updated": {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          status: data.status ?? "active",
          plan: planFromPriceId(priceId),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled || scheduledChangeAction === "cancel",
          scheduledChange: scheduledChangeAt,
        },
        update: {
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          status: data.status ?? "active",
          plan: planFromPriceId(priceId),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled || scheduledChangeAction === "cancel",
          scheduledChange: scheduledChangeAt,
        },
      });

      void auditLogService.record("billing.subscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { plan: planFromPriceId(priceId), status: data.status, eventType: normalized.type },
      });
      break;
    }
    case "subscription.cancelled": {
      // Terminal state: subscription has actually ended. Clear scheduledChange
      // and revoke paid access. The user's plan reverts to "free".
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          plan: "free",
          status: "canceled",
        },
        update: {
          plan: "free",
          status: "canceled",
          providerSubscriptionId: null,
          providerPriceId: null,
          cancelAtPeriodEnd: false,
          scheduledChange: null,
        },
      });

      void auditLogService.record("billing.unsubscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { eventType: normalized.type },
      });
      break;
    }
    case "subscription.paused": {
      // Explicit pause = not paying = no paid access (PlanService only grants
      // active/trialing/past_due). A scheduled pause (effective next period)
      // never sends this event — status stays "active" until it actually pauses.
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          plan: planFromPriceId(priceId),
          status: "paused",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled,
          scheduledChange: scheduledChangeAt,
        },
        update: {
          status: "paused",
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled,
          scheduledChange: scheduledChangeAt,
        },
      });

      void auditLogService.record("billing.subscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { eventType: normalized.type, status: "paused" },
      });
      break;
    }
    case "subscription.payment_succeeded": {
      // Payment succeeded — clear any scheduled change and confirm active status.
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          status: "active",
        },
        update: {
          status: "active",
          scheduledChange: null,
        },
      });

      void auditLogService.record("billing.subscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { eventType: normalized.type },
      });
      break;
    }
    case "subscription.payment_failed": {
      // Create-branch mirrors the created/updated fields so an out-of-order
      // delivery (payment_failed arriving before subscription.created/updated)
      // still lands a correct row — plan from the price so a past_due paying
      // customer keeps their tier instead of silently dropping to "free".
      // Update only flips status; never touches plan/periods (payment_failed
      // events may omit items, and a null price must not downgrade a real tier).
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          plan: planFromPriceId(priceId),
          status: "past_due",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled,
        },
        update: {
          status: "past_due",
        },
      });

      void auditLogService.record("billing.subscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { eventType: normalized.type, status: "past_due", failed: true },
      });
      break;
    }
  }

  void planService.invalidateCache(userId);
}

function planFromPriceId(priceId: string | null): string {
  if (!priceId) return "free";
  // Monthly and annual USD price IDs both map to the same plan tier.
  if (
    priceId === getPriceId("Pro", "month", "USD") ||
    priceId === getPriceId("Pro", "year", "USD")
  ) {
    return "pro";
  }
  if (
    priceId === getPriceId("Enterprise", "month", "USD") ||
    priceId === getPriceId("Enterprise", "year", "USD")
  ) {
    return "enterprise";
  }
  return "free";
}