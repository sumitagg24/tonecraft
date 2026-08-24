/**
 * Money formatting for Paddle transaction amounts.
 *
 * Paddle's Transaction entity returns amounts in lowest currency units
 * (cents for USD/EUR/GBP, whole units for zero-decimal currencies like
 * JPY/KRW/CLP). This utility converts and formats them properly.
 *
 * @see https://developer.paddle.com/concepts/price-catalog/currency
 */

/**
 * JPY, KRW, and CLP have no minor units — "1200" means ¥1,200 / ₩1,200 /
 * CLP$1,200, not ¥12.00. For every other currency, divide by 100.
 */
export function convertAmountFromLowestUnit(
  amount: string,
  currency: string,
): number {
  switch (currency) {
    case "JPY":
    case "KRW":
    case "CLP":
      return parseFloat(amount);
    default:
      return parseFloat(amount) / 100;
  }
}

/**
 * Format a currency amount using the user's locale.
 * Falls back to 'en-US' on the server where navigator is unavailable.
 */
export function formatCurrency(amount: number, currency: string): string {
  const language =
    typeof navigator !== "undefined" ? navigator.language : "en-US";
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Convert a Paddle lowest-unit amount string to a formatted currency string.
 * This is the canonical helper for displaying transaction totals.
 *
 * @example parseMoney("3000", "USD") // "$30.00"
 * @example parseMoney("1200", "JPY") // "¥1,200"
 */
export function parseMoney(
  amount: string = "0",
  currency: string = "USD",
): string {
  return formatCurrency(
    convertAmountFromLowestUnit(amount, currency),
    currency,
  );
}

/**
 * Simple USD formatter for pricing displays (kept for backward compat).
 */
export function formatMoney(usd: number): string {
  return `$${usd}`;
}
