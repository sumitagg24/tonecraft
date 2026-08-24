import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";
import type { ProrationBillingMode } from "@/billing/types";

const api = withApiHandler();

const VALID_PRORATION_MODES: ProrationBillingMode[] = [
  "prorated_immediately",
  "prorated_next_billing_period",
  "full_immediately",
  "full_next_billing_period",
  "do_not_bill",
];

/**
 * POST /api/billing/update — change a subscription's plan.
 *
 * Supports both preview (dry run) and commit (actual change).
 *
 * Security model:
 * - Auth checked by withApiHandler before any DB/SDK call
 * - subscriptionId resolved server-side from the authenticated user's record
 * - newPriceId validated against known prices
 *
 * Proration modes:
 * - Upgrade (tier up): prorated_immediately
 * - Downgrade (tier down): prorated_next_billing_period
 * - Term switch (monthly→annual): prorated_immediately
 * - Term switch (annual→monthly): prorated_next_billing_period
 */
export const POST = api.POST(async (ctx, body) => {
  const raw = (body ?? {}) as {
    newPriceId?: string;
    prorationBillingMode?: string;
    preview?: boolean;
  };

  if (!raw.newPriceId) {
    return fail("BAD_REQUEST", "newPriceId is required.", 400);
  }

  // Validate proration mode
  const prorationMode: ProrationBillingMode =
    raw.prorationBillingMode &&
    VALID_PRORATION_MODES.includes(raw.prorationBillingMode as ProrationBillingMode)
      ? (raw.prorationBillingMode as ProrationBillingMode)
      : "prorated_immediately"; // default for upgrades

  // Validate the price ID belongs to our catalog
  const knownPrices = [
    process.env.DODO_PRODUCT_BASIC || "",
    process.env.DODO_PRODUCT_PRO || "",
    process.env.DODO_PRODUCT_ADVANCED || "",
  ].filter(Boolean);

  if (!knownPrices.includes(raw.newPriceId)) {
    return fail("BAD_REQUEST", "Invalid price ID.", 400);
  }

  // Resolve subscription from authenticated user — never from input
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerSubscriptionId: true,
          status: true,
          plan: true,
          providerPriceId: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerSubscriptionId) {
    return fail("NOT_FOUND", "No active subscription found.", 404);
  }

  if (
    user.subscription.status !== "active" &&
    user.subscription.status !== "trialing"
  ) {
    return fail(
      "CONFLICT",
      `Cannot update subscription in "${user.subscription.status}" status.`,
      409,
    );
  }

  // Same price = no-op
  if (user.subscription.providerPriceId === raw.newPriceId) {
    return fail("CONFLICT", "Already on this plan.", 409);
  }

  const subscriptionId = user.subscription.providerSubscriptionId;

  try {
    // Preview mode: return the projected charges without applying
    if (raw.preview) {
      const preview = await billingService.previewSubscriptionUpdate({
        subscriptionId,
        newPriceId: raw.newPriceId,
        prorationBillingMode: prorationMode,
      });

      return ok({
        preview: true,
        immediateCharge: preview.immediateTransaction
          ? "$" + String(Number(0) / 100)
          : null,
        recurringPrice: preview.recurringTransactionDetails
          ? "$" + String(Number(0) / 100)
          : null,
        nextBilledAt: preview.nextBilledAt,
        currentPlan: user.subscription.plan,
        newPlan:
          raw.newPriceId === (process.env.DODO_PRODUCT_PRO || "")
            ? "pro"
            : "advanced",
        prorationMode,
      });
    }

    // Commit mode: apply the change
    await billingService.updateSubscription({
      subscriptionId,
      newPriceId: raw.newPriceId,
      prorationBillingMode: prorationMode,
    });

    logger.info("Subscription updated", {
      userId: ctx.user.id,
      subscriptionId,
      oldPlan: user.subscription.plan,
      newPriceId: raw.newPriceId,
      prorationMode,
    });

    void auditLogService.record("billing.subscribe", "subscription", {
      actorId: ctx.user.id,
      resourceId: subscriptionId,
      metadata: {
        action: "plan_change",
        oldPlan: user.subscription.plan,
        newPriceId: raw.newPriceId,
        prorationMode,
      },
    });

    return ok({
      success: true,
      message: "Subscription updated successfully.",
      prorationMode,
    });
  } catch (err) {
    logger.error("Update subscription failed", {
      userId: ctx.user.id,
      subscriptionId,
      error: String(err),
    });
    return fail(
      "INTERNAL_ERROR",
      "Failed to update subscription. Please try again or contact support.",
      500,
    );
  }
});
