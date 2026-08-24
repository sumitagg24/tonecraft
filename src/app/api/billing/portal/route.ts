import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";

const api = withApiHandler();

/**
 * POST /api/billing/portal — create a customer portal session URL.
 *
 * The portal lets users self-service: view invoices, update payment methods,
 * cancel subscriptions. This route creates a fresh, one-time-use session URL
 * and returns it — never cache or reuse portal URLs.
 *
 * Security model:
 * - Auth checked by withApiHandler before any DB/SDK call
 * - customerId resolved server-side from the authenticated user (never from input)
 * - Returns only the URL, not the raw session object
 *
 * Deep links:
 * - overview: general portal home
 * - subscriptions[].cancelSubscription: direct link to cancel UI
 * - subscriptions[].updateSubscriptionPaymentMethod: direct link to payment method UI
 */
export const POST = api.POST(async (ctx) => {
  // Throttle portal-session creation (audit 12 P1.8).
  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many requests, try again later", 429);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      id: true,
      subscription: {
        select: {
          providerCustomerId: true,
          providerSubscriptionId: true,
          status: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerCustomerId) {
    return fail("NOT_FOUND", "No billing customer found. Subscribe first.", 404);
  }

  // Collect active subscription IDs for deep links. An empty array is valid —
  // the overview URL works without deep links, but passing active subs gives
  // the user direct access to cancel/update per subscription.
  const subscriptionIds: string[] = [];
  if (
    user.subscription.providerSubscriptionId &&
    user.subscription.status === "active"
  ) {
    subscriptionIds.push(user.subscription.providerSubscriptionId);
  }

  // Mint the session. customerId comes from the DB (server-side), never input.
  const portal = await billingService.createPortalSession(
    user.subscription.providerCustomerId,
    subscriptionIds,
  );

  logger.info("Portal session created", {
    userId: user.id,
    subscriptionIds: subscriptionIds.length,
  });

  return ok({
    url: portal.url,
    // Expose deep links so the client can offer direct cancel/update flows
    // if desired, without using the full session object.
    deepLinks: portal.deepLinks,
  });
});
