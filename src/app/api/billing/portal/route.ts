import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";

const api = withApiHandler();

export const POST = api.POST(async (ctx) => {
  // Throttle portal-session creation (audit 12 P1.8).
  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many requests, try again later", 429);
  }

  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { id: true, subscription: { select: { providerCustomerId: true } } },
  });

  if (!user?.subscription?.providerCustomerId) {
    return fail("NOT_FOUND", "No subscription found", 404);
  }

  const portal = await billingService.createPortalSession(
    user.subscription.providerCustomerId
  );

  logger.info("Portal session created", { userId: user.id });
  return ok({ url: portal.url });
});
