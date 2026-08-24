/**
 * Shared Paddle price-ID mapping — single source of truth for the checkout
 * route, the webhook sync, and the billing health diagnostic.
 *
 * Each plan has a monthly USD price and an annual USD price (the Annual
 * toggle on the pricing page sends `interval=year`, which selects the annual
 * price — typically 12 × monthly × 0.8, i.e. "20% off").
 *
 * Env vars override the monthly fallbacks, which mirror the live prices.
 * Annual prices have no fallback — they must be created in the Paddle catalog
 * and set via the env vars below, otherwise the Annual toggle reports a clear
 * setup error.
 */

export type BillingInterval = "month" | "year";
export type BillingCurrency = "USD";

const FALLBACK_PRICES: Record<string, string | undefined> = {
  "Pro:month:USD": "pri_01kznmkkfqz0xsmqyawck8pmmf",
  "Enterprise:month:USD": "pri_01kznmkms8yc74sw01gbb8scej",
};

const PRICE_ENV: Record<string, string | undefined> = {
  "Pro:month:USD": process.env.PADDLE_PRICE_PRO,
  "Pro:year:USD": process.env.PADDLE_PRICE_PRO_ANNUAL,
  "Enterprise:month:USD": process.env.PADDLE_PRICE_ENTERPRISE,
  "Enterprise:year:USD": process.env.PADDLE_PRICE_ENTERPRISE_ANNUAL,
};

/**
 * Resolve the Paddle price ID for a plan + billing interval + currency.
 * Returns `undefined` when the exact combination isn't configured.
 */
export function getPriceId(
  plan: string,
  interval: BillingInterval = "month",
  currency: BillingCurrency = "USD"
): string | undefined {
  const key = `${plan}:${interval}:${currency}`;
  return PRICE_ENV[key] ?? FALLBACK_PRICES[key];
}

/** Monthly-only USD map kept for simple lookups (webhook/health). */
export const PLAN_PRICE_MAP: Record<string, string> = {
  Pro: getPriceId("Pro", "month", "USD") as string,
  Enterprise: getPriceId("Enterprise", "month", "USD") as string,
};
