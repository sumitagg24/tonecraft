import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

/**
 * POST /api/billing/cancel — cancel the authenticated user's subscription.
 *
 * Security model (per paddle-subscription-cancel skill):
 * - Auth checked by withApiHandler before any DB/SDK call
 * - subscriptionId resolved server-side from the authenticated user's record
 *   (never from client input) — prevents canceling another user's subscription
 * - Defaults to effectiveFrom: "next_billing_period" — the user keeps access
 *   through what they've already paid for
 *
 * After cancel:
 * - Status stays "active" until the period ends
 * - scheduledChange.action = "cancel" with effectiveAt date
 * - At period end, webhook fires subscription.canceled → status flips to "canceled"
 */
export const POST = api.POST(async (ctx, body) => {
  const raw = (body ?? {}) as {
    effectiveFrom?: "next_billing_period" | "immediately";
  };

  // Resolve the subscription from the authenticated user's record — never
  // accept a subscriptionId from the client.
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerSubscriptionId: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerSubscriptionId) {
    return fail("NOT_FOUND", "No active subscription found.", 404);
  }

  if (
    user.subscription.status !== "active" &&
    user.subscription.status !== "trialing" &&
    user.subscription.status !== "past_due"
  ) {
    return fail(
      "CONFLICT",
      `Subscription is already ${user.subscription.status}.`,
      409,
    );
  }

  // Default to "next_billing_period" — the safe default per the skill.
  // Only allow "immediately" if explicitly requested (for "Cancel & refund"
  // flows). Most users expect "Cancel" to mean "stop at the end of my period."
  const effectiveFrom = raw.effectiveFrom === "immediately"
    ? "immediately"
    : "next_billing_period";

  const subscriptionId = user.subscription.providerSubscriptionId;

  try {
    await billingService.cancelSubscription(subscriptionId, effectiveFrom);

    logger.info("Subscription cancel requested", {
      userId: ctx.user.id,
      subscriptionId,
      effectiveFrom,
      plan: user.subscription.plan,
    });

    void auditLogService.record("billing.unsubscribe", "subscription", {
      actorId: ctx.user.id,
      resourceId: subscriptionId,
      metadata: {
        effectiveFrom,
        plan: user.subscription.plan,
      },
    });

    // Return a slim DTO — never the raw Subscription object.
    return ok({
      success: true,
      effectiveFrom,
      message:
        effectiveFrom === "next_billing_period"
          ? "Subscription will cancel at the end of the current billing period. You retain access until then."
          : "Subscription canceled immediately. A prorated refund will be processed.",
    });
  } catch (err) {
    logger.error("Cancel subscription failed", {
      userId: ctx.user.id,
      subscriptionId,
      error: String(err),
    });
    return fail(
      "INTERNAL_ERROR",
      "Failed to cancel subscription. Please try again or contact support.",
      500,
    );
  }
});
