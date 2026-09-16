import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { auditLogService } from "@/services/AuditLogService";
import { ensureRealEmail, isPlaceholderEmail } from "@/lib/clerk-email";
import { z } from "zod";
import {
  allConfiguredProductIds,
  grantForProductId,
  productIdForPlan,
} from "@/billing/dodoProducts";

const api = withApiHandler();

const checkoutSchema = z.object({
  plan: z.string().min(1).max(32).optional(),
  interval: z.enum(["month", "year"]).optional(),
  productId: z.string().min(1).max(64).optional(),
});

/**
 * POST /api/billing/checkout — create a Dodo Payments checkout session.
 *
 * Body: { plan?: string, productId?: string, interval?: "month"|"year" }
 * - plan: "basic" | "pro" | "advanced" (resolves to DODO_PRODUCT_* env vars)
 * - productId: direct Dodo product id (validated server-side against the
 *   configured catalog — client-supplied ids are never trusted)
 *
 * Returns: { url: string } — redirect the user to this URL.
 *
 * Amount/price is never accepted from the client: the checkout cart is built
 * from a server-resolved product id, so Dodo prices it authoritatively.
 */
export const POST = api.POST(async (ctx, body) => {
  try {
    const parsed = checkoutSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail("BAD_REQUEST", "Invalid checkout request.", 400);
    }
    const raw = parsed.data;
    const plan = (raw.plan ?? "").toLowerCase();
    const interval = raw.interval === "year" ? "year" : "month";

    // Resolve the product server-side. A client-passed productId is only
    // honored when it matches one of OUR configured products — never a
    // product from outside the catalog (price/plan tampering).
    let productId = raw.productId || "";
    let grant: string | null = null;
    if (productId) {
      if (!allConfiguredProductIds().includes(productId)) {
        return fail("BAD_REQUEST", "Invalid product ID.", 400);
      }
      grant = grantForProductId(productId);
    } else {
      productId = productIdForPlan(plan, interval) ?? "";
      grant = grantForProductId(productId);

      if (interval === "year" && !productId && plan !== "") {
        // Never silently bill the monthly product for a "yearly" checkout —
        // if the annual product id isn't configured, say so instead.
        return fail(
          "BAD_REQUEST",
          "Annual billing isn't available for this plan yet. Please choose monthly billing.",
          400,
        );
      }
    }

    if (!productId) {
      return fail("BAD_REQUEST", "Missing productId or valid plan name", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        subscription: { select: { status: true, plan: true } },
      },
    });
    if (!user) {
      return fail("UNAUTHORIZED", "Authentication required.", 401);
    }

    // Never send a lazy-sync placeholder (temp-*@clerk.local) to Dodo as the
    // customer email: receipts would go nowhere and the webhook's
    // email-fallback user resolution would silently fail. Resolve the
    // authoritative address from Clerk and backfill the row (the Clerk
    // dashboard webhook is the primary sync, but it can lag or be
    // unconfigured — every production row currently holds a placeholder).
    // If Clerk is unreachable we still proceed: the webhook's metadata.userId
    // path activates the subscription regardless of email.
    let checkoutEmail = user.email ?? undefined;
    if (isPlaceholderEmail(user.email)) {
      const real = await ensureRealEmail(user.id, user.clerkId, user.email);
      if (real) checkoutEmail = real;
      else {
        logger.error("Checkout proceeding with placeholder email; Clerk lookup failed", {
          userId: user.id,
        });
      }
    }

    // Only block checkout when the existing subscription actually grants paid
    // access (active/trialing/past_due — mirrors PlanService.isAccessGranting
    // Status). Legacy rows in transitional states (e.g. an "incomplete"
    // checkout that never finished under a previous provider, or
    // canceled/expired/paused subscriptions) must be able to check out again.
    // Plan-free rows (plan="free", status="active") are also purchasable —
    // checkout uses the product id to decide the grant, not the stored plan.
    const blockingStatuses = new Set(["active", "trialing", "past_due"]);
    const currentPlan = user.subscription?.plan?.toLowerCase() ?? "free";
    if (
      user.subscription &&
      blockingStatuses.has(user.subscription.status ?? "") &&
      currentPlan !== "free"
    ) {
      return fail("CONFLICT", "Subscription already active.", 409);
    }

    // The grant derived from the product id is what the webhook will persist;
    // keep metadata consistent so any consumer of it sees the same plan.
    const metadataPlan = grant ?? (plan || "pro");

    const checkout = await billingService.createCheckout({
      priceId: productId,
      userId: user.id,
      email: checkoutEmail,
      name: user.name ?? undefined,
      metadata: { plan: metadataPlan, userId: user.id },
      // Prefer the explicit Dodo cancel URL (canonical www billing page) over
      // NEXT_PUBLIC_APP_URL, which can lag behind the live domain (e.g.
      // localhost during development). DodoProvider applies the same priority
      // when input.cancelUrl is absent, but the explicit value wins — so send
      // the right one here instead of forcing the APP_URL fallback.
      cancelUrl:
        process.env.DODO_PAYMENTS_CANCEL_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/billing`,
    });

    logger.info("Checkout created", { userId: user.id, productId });

    void auditLogService.record("billing.subscribe", "checkout", {
      actorId: ctx.user.id,
      metadata: { productId, plan: metadataPlan },
    });

    return ok({ url: checkout.url });
  } catch (err) {
    logger.error("Checkout error", { userId: ctx.user.id, error: String(err) });

    // Surface Dodo-specific errors so the user knows what to do
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("MERCHANT_NOT_LIVE")) {
      return fail(
        "SERVICE_UNAVAILABLE",
        "Payments are not yet enabled. The merchant account is still under review. Please try again later.",
        503,
      );
    }
    if (msg.includes("INVALID_REQUEST_BODY") || msg.includes("422")) {
      return fail("BAD_REQUEST", "Invalid product configuration. Please contact support.", 400);
    }
    if (msg.includes("Authentication failed") || msg.includes("401")) {
      return fail("SERVICE_UNAVAILABLE", "Payment service authentication failed. Please contact support.", 503);
    }
    return fail("SERVICE_UNAVAILABLE", "Billing is temporarily unavailable. Please try again.", 503);
  }
});
