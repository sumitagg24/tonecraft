import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { ApiError } from "@paddle/paddle-node-sdk";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";

const PLAN_PRICE_MAP: Record<string, string | undefined> = {
  Pro: process.env.PADDLE_PRICE_PRO ?? "pri_01kyn5577vywxh8z8b40h96ka5",
  Enterprise: process.env.PADDLE_PRICE_ENTERPRISE ?? "pri_01kyn5rt66qd17jq4b67v85j6v",
};

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  try {
    const { plan } = (body ?? {}) as { plan?: string };
    if (!plan || !PLAN_PRICE_MAP[plan]) {
      return fail("BAD_REQUEST", "Invalid request.", 400);
    }

    // Checkout creates Paddle customers/sessions — throttle (audit 12 P1.8).
    const currentPlan = await planService.getPlan(ctx.user.id);
    const limit = await checkMessageLimit(ctx.user.id, currentPlan.tier);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many requests, try again later", 429);
    }

    const priceId = PLAN_PRICE_MAP[plan];

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, email: true, name: true, subscription: true },
    });
    if (!user) {
      return fail("UNAUTHORIZED", "Authentication required.", 401);
    }

    if (user.subscription?.status === "active" || user.subscription?.status === "trialing") {
      return fail("CONFLICT", "Subscription already active.", 409);
    }

    let customerId = user.subscription?.providerCustomerId;
    if (!customerId) {
      const result = await billingService.createCustomer({
        email: user.email ?? "",
        name: user.name ?? undefined,
        userId: user.id,
      });
      customerId = result.customerId;
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          paymentProvider: "paddle",
          providerCustomerId: customerId,
          plan: plan.toLowerCase(),
          status: "incomplete",
        },
        update: { providerCustomerId: customerId },
      });
    }

    const checkout = await billingService.createCheckout({
      priceId,
      userId: user.id,
      customerId,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { plan: plan.toLowerCase() },
    });

    logger.info("Checkout created", { userId: user.id, plan });
    return ok({ url: checkout.url });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.retryAfter != null) {
        logger.error("Paddle rate limited", { detail: err.detail, retryAfter: err.retryAfter });
        return fail("RATE_LIMITED", "Paddle temporarily rate limited.", 429);
      }
      logger.error("Paddle API error", { code: err.code, detail: err.detail });
      return fail("SERVICE_UNAVAILABLE", "Billing provider unavailable.", 503);
    }
    logger.error("Unexpected checkout error", { error: String(err) });
    return fail("INTERNAL_ERROR", "Unexpected billing error.", 500);
  }
});
