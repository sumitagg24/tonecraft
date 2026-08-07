import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { ApiError } from "@paddle/paddle-node-sdk";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";
import { getPriceId, type BillingCurrency, type BillingInterval } from "@/lib/billing-prices";

const api = withApiHandler();

const VALID_PLANS = ["Pro", "Enterprise"] as const;

export const POST = api.POST(async (ctx, body) => {
  try {
    const raw = (body ?? {}) as { plan?: string; interval?: string; currency?: string };
    // Normalize: accept "pro"/"Pro"/"PRO", "month"/"year", "USD"/"INR".
    const plan = VALID_PLANS.find(
      (p) => p.toLowerCase() === (raw.plan ?? "").toLowerCase()
    );
    const interval: BillingInterval =
      raw.interval === "year" ? "year" : "month";
    const currency: BillingCurrency = raw.currency === "INR" ? "INR" : "USD";
    if (!plan) {
      return fail("BAD_REQUEST", "Invalid request.", 400);
    }

    // NOTE: checkout intentionally bypasses message/credit limits — a user who
    // hit their free daily cap must still be able to subscribe (fixes "payments
    // blocked by usage limit").
    let priceId = getPriceId(plan, interval, currency);
    // Indian customers get INR when configured; otherwise fall back to USD.
    if (!priceId && currency === "INR") {
      priceId = getPriceId(plan, interval, "USD");
    }
    if (!priceId) {
      const message =
        interval === "year"
          ? `Annual pricing isn't configured yet — add a yearly price for ${plan} in Catalog → Products and set PADDLE_PRICE_${plan.toUpperCase()}_ANNUAL.`
          : `No price configured for ${plan} — set PADDLE_PRICE_${plan.toUpperCase()}.`;
      return fail("SERVICE_UNAVAILABLE", message, 503);
    }

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
      metadata: { plan: plan.toLowerCase(), interval, currency },
    });

    logger.info("Checkout created", { userId: user.id, plan, interval, currency });

    void auditLogService.record("billing.subscribe", "checkout", {
      actorId: ctx.user.id,
      metadata: { plan: plan.toLowerCase(), interval, currency, priceId },
    });

    // transactionId lets the client open the Paddle.js checkout overlay
    // directly (no redirect to the raw checkout URL).
    let transactionId: string | null = null;
    try {
      transactionId = new URL(checkout.url).searchParams.get("_ptxn");
    } catch {
      // URL parse is best-effort; the client falls back to navigating to it.
    }

    return ok({ url: checkout.url, transactionId });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.retryAfter != null) {
        logger.error("Paddle rate limited", { detail: err.detail, retryAfter: err.retryAfter });
        return fail("RATE_LIMITED", "Paddle temporarily rate limited.", 429);
      }
      logger.error("Paddle API error", { code: err.code, detail: err.detail });
      // Surface Paddle's actual reason (e.g. "no default payment link has been
      // set for this account") so the user can fix the dashboard setting instead
      // of seeing a generic "Billing provider unavailable."
      const detail = err.detail || err.message || "Checkout could not be created by the payment provider.";
      return fail("SERVICE_UNAVAILABLE", `Billing unavailable — ${detail}`, 503);
    }
    logger.error("Unexpected checkout error", { error: String(err) });
    return fail("INTERNAL_ERROR", "Unexpected billing error.", 500);
  }
});
