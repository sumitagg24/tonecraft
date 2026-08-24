import { Webhooks } from "@dodopayments/nextjs";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { auditLogService } from "@/services/AuditLogService";
import { claimWebhookEvent, markWebhookProcessed } from "@/lib/webhook-dedupe";
// Helper to mark webhook as processed after successful handling
async function markProcessed(payload: Record<string, unknown>) {
  const eventId = (payload.payment_id as string) || (payload.subscription_id as string) || "";
  if (eventId) {
    try {
      await markWebhookProcessed("dodo", eventId);
    } catch (err) {
      logger.error("Failed to mark webhook processed", { error: String(err) });
    }
  }
}


/**
 * POST /api/webhooks/dodo — receive Dodo Payments webhook events.
 * Matches the URL configured in the Dodo dashboard:
 * https://tonecraft.site/api/webhooks/dodo
 */
export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onPayload: async (payload) => {
    const p = payload as Record<string, unknown>;
    const eventId =
      (p.payment_id as string) || (p.subscription_id as string) || "";

    const claim = eventId
      ? await claimWebhookEvent("dodo", eventId, p.type as string)
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
    const p = payload as Record<string, unknown>;
    logger.info("Dodo payment succeeded", { paymentId: p.payment_id });
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onPaymentFailed: async (payload) => {
    const p = payload as Record<string, unknown>;
    logger.warn("Dodo payment failed", { paymentId: p.payment_id });
    // Sync subscription to past_due so the access gate shows the right state.
    // Also mark processed — without this, failed-payment events would be
    // retried indefinitely, flooding the logs.
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionActive: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionCancelled: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "canceled");
    await markProcessed(p);
  },

  onSubscriptionOnHold: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionRenewed: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionPlanChanged: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "active");
    await markProcessed(p);
  },

  onSubscriptionFailed: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "past_due");
    await markProcessed(p);
  },

  onSubscriptionExpired: async (payload) => {
    const p = payload as Record<string, unknown>;
    await syncSubscriptionFromDodo(p, "canceled");
    await markProcessed(p);
  },
});

// ── Subscription sync ────────────────────────────────────────────────────

function extractUserId(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) return null;
  return (metadata.userId as string) || (metadata.user_id as string) || null;
}

function planFromProductId(productId: string): string {
  const BASIC = process.env.DODO_PRODUCT_BASIC || "";
  const PRO = process.env.DODO_PRODUCT_PRO || "";
  const ADVANCED = process.env.DODO_PRODUCT_ADVANCED || "";
  if (productId === PRO) return "pro";
  if (productId === BASIC) return "basic";
  if (productId === ADVANCED) return "enterprise";
  return "free";
}

async function syncSubscriptionFromDodo(
  payload: Record<string, unknown>,
  status: string,
) {
  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const userId = extractUserId(metadata);
  if (!userId) {
    logger.warn("No userId in Dodo webhook", {
      type: payload.type,
      subscriptionId: payload.subscription_id,
    });
    return;
  }

  const subscriptionId = (payload.subscription_id as string) || "";
  const customerId = (payload.customer_id as string) || "";
  const product = payload.product as Record<string, unknown> | undefined;
  const productId = (product?.product_id as string) || "";
  const plan = planFromProductId(productId);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      paymentProvider: "dodo",
      providerSubscriptionId: subscriptionId,
      providerCustomerId: customerId,
      providerPriceId: productId,
      status,
      plan,
      cancelAtPeriodEnd: status === "canceled",
    },
    update: {
      providerSubscriptionId: subscriptionId,
      providerCustomerId: customerId || undefined,
      providerPriceId: productId,
      status,
      plan,
      cancelAtPeriodEnd: status === "canceled",
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
