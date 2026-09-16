import { ok, withApiHandler } from "@/lib/withApiHandler";
import { billingService } from "@/billing/BillingService";
import { logger } from "@/lib/logger";

const api = withApiHandler();

/**
 * GET /api/billing/health
 *
 * Public-safe diagnostic: returns only an overall status ("ok" or
 * "action_required") plus a count of configured env vars and products.
 *
 * Deliberately does NOT expose:
 * - Env var names, values, or descriptions (information disclosure)
 * - API error messages (could reveal SDK version, endpoint structure)
 * - Product/price IDs (Dodo internal identifiers)
 */
export const GET = api.GET(async () => {
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "sandbox";

  // Count required env vars without naming them
  const requiredVars = [
    process.env.DODO_PAYMENTS_API_KEY,
    process.env.DODO_PRODUCT_PRO,
    process.env.DODO_PRODUCT_ADVANCED,
    process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  ];
  const envCount = requiredVars.filter(Boolean).length;
  const envTotal = requiredVars.length;

  let productCount = 0;
  let apiReachable = false;

  try {
    const products = await billingService.listProducts();
    apiReachable = true;
    productCount = products.length;
  } catch (err) {
    logger.error("Billing health: Dodo API unreachable", { error: String(err) });
    // Do not expose the error message to the caller
  }

  const allEnvOk = envCount === envTotal;
  const overall = allEnvOk && apiReachable && productCount > 0 ? "ok" : "action_required";

  return ok({
    provider: billingService.getProviderName(),
    environment,
    overall,
    envConfigured: `${envCount}/${envTotal}`,
    apiReachable,
    productCount,
  });
});
