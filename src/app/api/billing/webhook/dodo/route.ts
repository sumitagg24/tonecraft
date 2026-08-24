import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook-dedupe";

/**
 * POST /api/billing/webhook/dodo — receive Dodo Payments webhook events.
 *
 * Uses the @dodopayments/nextjs adapter which handles:
 * - Signature verification (Standard Webhooks spec)
 * - Payload validation
 * - Event routing
 */
export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (payload) => {
    const p = payload as Record<string, unknown>;
    const eventId =
      (p.payment_id as string) || (p.subscription_id as string) || "";

    // Deduplication
    const claim = eventId
      ? await claimWebhookEvent("dodo", eventId, p.type as string)
      : "new";
    if (claim === "duplicate") {
      logger.info("Dodo webhook replay skipped", {
        eventId,
        type: p.type,
      });
      return;
    }

    logger.info("Dodo webhook received", { type: p.type, eventId });

    void auditLogService.record("billing.webhook_received", "billing", {
      metadata: { eventType: p.type, provider: "dodo" },
    });

    // Process event
    try {
      await processEvent(payload);
      if (eventId) await markWebhookProcessed("dodo", eventId);
    } catch (err) {
      logger.error("Dodo webhook sync failed", {
        type: p.type,
        error: String(err),
      });
    }
  },

  // Granular event handlers
  onPaymentSucceeded: async (payload) => {
    const p = payload as Record<string, unknown>;
    logger.info("Payment succeeded", { paymentId: p.payment_id });
    await syncSubscriptionFromDodo(p, "active");
  },

  onPaymentFailed: async (payload) => {
    const p = payload as Record<string, unknown>;
    logger.warn("Payment failed", { paymentId: p.payment_id });
  },

  onSubscriptionActive: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
  },

  onSubscriptionCancelled: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "cancelled");
  },

  onSubscriptionOnHold: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "past_due");
  },

  onSubscriptionRenewed: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
  },

  onSubscriptionPlanChanged: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
  },

  onSubscriptionFailed: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "past_due");
  },

  onSubscriptionExpired: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "cancelled");
  },
});

// ── Event processing ─────────────────────────────────────────────────────

async function processEvent(payload: unknown) {
  // Events are handled by the granular handlers above
  const p = payload as Record<string, unknown>;
  logger.debug("Dodo webhook event (no specific handler)", {
    type: p.type,
  });
}

// ── Subscription sync ────────────────────────────────────────────────────

function extractUserId(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) return null;
  return (metadata.userId as string) || (metadata.user_id as string) || null;
}

function planFromProductId(productId: string): string {
  const PRO_MONTHLY = process.env.DODO_PRODUCT_PRO_MONTHLY || "";
  const PRO_ANNUAL = process.env.DODO_PRODUCT_PRO_ANNUAL || "";
  const ADVANCED_MONTHLY = process.env.DODO_PRODUCT_ADVANCED_MONTHLY || "";
  const ADVANCED_ANNUAL = process.env.DODO_PRODUCT_ADVANCED_ANNUAL || "";

  if (productId === PRO_MONTHLY || productId === PRO_ANNUAL) return "pro";
  if (productId === ADVANCED_MONTHLY || productId === ADVANCED_ANNUAL)
    return "enterprise";
  return "free";
}

async function syncSubscriptionFromDodo(
  payload: Record<string, unknown>,
  status: string,
) {
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const userId = extractUserId(metadata);
  if (!userId) {
    logger.warn("No userId in Dodo webhook metadata", {
      type: payload.type,
      subscriptionId: payload.subscription_id,
    });
    return;
  }

  const subscriptionId = (payload.subscription_id as string) || "";
  const product = payload.product as Record<string, unknown> | undefined;
  const productId = (product?.product_id as string) || "";
  const plan = planFromProductId(productId);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: "dodo",
      providerSubscriptionId: subscriptionId,
      providerPriceId: productId,
      status,
      plan,
      cancelAtPeriodEnd: status === "cancelled",
    },
    update: {
      providerSubscriptionId: subscriptionId,
      providerPriceId: productId,
      status,
      plan,
      cancelAtPeriodEnd: status === "cancelled",
      scheduledChange: null,
    },
  });

  void auditLogService.record("billing.subscribe", "subscription", {
    actorId: userId,
    resourceId: subscriptionId,
    metadata: { plan, status, provider: "dodo" },
  });

  void planService.invalidateCache(userId);
}
