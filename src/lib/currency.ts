/**
 * Money formatting for pricing displays.
 *
 * Pricing is displayed and charged in USD only (per product decision — the
 * checkout always uses the configured USD Paddle price). All displays show
 * dollars; there is no INR localization.
 */

/** Format a USD amount for display. */
export function formatMoney(usd: number): string {
  return `$${usd}`;
}
