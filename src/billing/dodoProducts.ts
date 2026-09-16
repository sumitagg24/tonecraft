/**
 * Server-side Dodo product catalog helpers.
 *
 * Product ids are always resolved from server environment variables — never
 * from client input. The same mapping is used by the checkout route (to
 * validate client-supplied product ids) and by the webhook sync (to map a
 * product id in an event back to the plan it grants), so both sides always
 * agree on which plan a product grants.
 */

export const PLAN_PRODUCT_ENV: Record<string, { month: string; year: string }> = {
  basic: { month: "DODO_PRODUCT_BASIC", year: "DODO_PRODUCT_BASIC_ANNUAL" },
  pro: { month: "DODO_PRODUCT_PRO", year: "DODO_PRODUCT_PRO_ANNUAL" },
  // "advanced" is the UI-facing name; "enterprise" is the stored plan grant.
  advanced: { month: "DODO_PRODUCT_ADVANCED", year: "DODO_PRODUCT_ADVANCED_ANNUAL" },
  enterprise: { month: "DODO_PRODUCT_ADVANCED", year: "DODO_PRODUCT_ADVANCED_ANNUAL" },
};

const GRANT_ROWS: { grant: string; envKeys: string[] }[] = [
  { grant: "basic", envKeys: ["DODO_PRODUCT_BASIC", "DODO_PRODUCT_BASIC_ANNUAL"] },
  { grant: "pro", envKeys: ["DODO_PRODUCT_PRO", "DODO_PRODUCT_PRO_ANNUAL"] },
  { grant: "enterprise", envKeys: ["DODO_PRODUCT_ADVANCED", "DODO_PRODUCT_ADVANCED_ANNUAL"] },
];

/** All product ids the server is configured to sell (monthly + annual). */
export function allConfiguredProductIds(): string[] {
  const ids: string[] = [];
  for (const row of GRANT_ROWS) {
    for (const key of row.envKeys) {
      const value = process.env[key];
      if (value) ids.push(value);
    }
  }
  return ids;
}

/**
 * The plan tier a product id grants ("basic" | "pro" | "enterprise"), or null
 * when the id is not one of the configured products.
 */
export function grantForProductId(productId: string): string | null {
  for (const row of GRANT_ROWS) {
    if (row.envKeys.some((key) => process.env[key] === productId)) return row.grant;
  }
  return null;
}

/**
 * Resolve the configured product id for a plan + billing interval, or
 * undefined when the plan/interval isn't configured (e.g. annual products
 * not yet created in the catalog).
 */
export function productIdForPlan(
  plan: string,
  interval: "month" | "year",
): string | undefined {
  const keys = PLAN_PRODUCT_ENV[plan];
  if (!keys) return undefined;
  const value = process.env[keys[interval]];
  return value || undefined;
}

/** True when `id` matches one of the products the server is configured to sell. */
export function isConfiguredProductId(id: string): boolean {
  return id.length > 0 && allConfiguredProductIds().includes(id);
}