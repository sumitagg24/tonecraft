import { NextResponse } from "next/server";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { getPriceId } from "@/lib/billing-prices";
import { fireAndForget } from "@/lib/fire-and-forget";

export async function POST(req: Request) {
  const body = await req.text();

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let event: unknown;
  try {
    event = await billingService.verifyWebhook({ body, headers });
  } catch (err) {
    logger.warn("Webhook verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const normalized = await billingService.handleWebhookEvent(event);

  logger.info("Webhook received", { type: normalized.type });
  // Only record events we actually act on — ignored ones (product.*, customer.*,
  // transaction.created, …) would otherwise spam the audit log.
  if (normalized.type !== "ignored") {
    void auditLogService.record("billing.webhook_received", "billing", {
      metadata: { eventType: normalized.type },
    });
  }

  try {
    await syncSubscription(normalized);
  } catch (err) {
    logger.error("Webhook sync failed", { type: normalized.type, error: String(err) });
  }

  return NextResponse.json({ received: true });
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
  custom_data?: Record<string, string>;
  customData?: Record<string, string>;
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
          cancelAtPeriodEnd: isCanceled,
        },
        update: {
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          status: data.status ?? "active",
          plan: planFromPriceId(priceId),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled,
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
        },
        update: {
          status: "paused",
          providerSubscriptionId: subscriptionId,
          providerPriceId: priceId,
          providerCustomerId: customerId,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: isCanceled,
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

      void auditLogService.record("billing.unsubscribe", "subscription", {
        actorId: userId,
        resourceId: subscriptionId,
        metadata: { eventType: normalized.type },
      });
      break;
    }
    case "subscription.payment_succeeded": {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          paymentProvider: "paddle",
          status: "active",
        },
        update: {
          status: "active",
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

  fireAndForget(planService.invalidateCache(userId), "billing.invalidatePlanCache", { userId });
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