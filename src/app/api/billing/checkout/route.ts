import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

/**
 * POST /api/billing/checkout — create a Dodo Payments checkout session.
 *
 * Body: { plan?: string, productId?: string }
 * - plan: "pro" or "advanced" (maps to DODO_PRODUCT_* env vars)
 * - productId: direct Dodo product ID (e.g. "pdt_...")
 *
 * Returns: { url: string } — redirect the user to this URL.
 */
export const POST = api.POST(async (ctx, body) => {
  try {
    const raw = (body ?? {}) as { plan?: string; productId?: string };

    // Resolve product ID from plan name or direct ID
    let productId = raw.productId;
    if (!productId) {
      const plan = (raw.plan ?? "").toLowerCase();
      if (plan === "pro") {
        productId = process.env.DODO_PRODUCT_PRO;
      } else if (plan === "basic") {
        productId = process.env.DODO_PRODUCT_BASIC;
      } else if (plan === "enterprise" || plan === "advanced") {
        productId = process.env.DODO_PRODUCT_ADVANCED;
      }
    }

    if (!productId) {
      return fail("BAD_REQUEST", "Missing productId or valid plan name", 400);
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

    const checkout = await billingService.createCheckout({
      priceId: productId,
      userId: user.id,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { plan: raw.plan ?? "pro", userId: user.id },
    });

    logger.info("Checkout created", { userId: user.id, productId });

    void auditLogService.record("billing.subscribe", "checkout", {
      actorId: ctx.user.id,
      metadata: { productId, plan: raw.plan },
    });

    return ok({ url: checkout.url });
  } catch (err) {
    logger.error("Checkout error", { userId: ctx.user.id, error: String(err) });
    return fail("SERVICE_UNAVAILABLE", "Billing is temporarily unavailable. Please try again.", 503);
  }
});
