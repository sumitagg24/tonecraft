/**
 * usePaddlePrices — fetches localized prices from Paddle.PricePreview().
 *
 * Takes a Paddle instance and country code, returns a map of
 * priceId → formatted total string (e.g. "$6.00", "€5,40", "¥800").
 *
 * @see paddle-pricing-pages skill for the full pattern.
 */

import {
  type Paddle,
  type PricePreviewParams,
  type PricePreviewResponse,
} from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { PRICING_TIERS } from "@/lib/constants";

export type PaddlePrices = Record<string, string>;

/**
 * Build the list of price IDs to preview from PRICING_TIERS.
 * Excludes free tier (empty priceId) and deduplicates.
 */
function getLineItems(): PricePreviewParams["items"] {
  const seen = new Set<string>();
  const items: PricePreviewParams["items"] = [];

  for (const tier of PRICING_TIERS) {
    if (!tier.priceId?.month) continue; // free tier
    for (const priceId of [tier.priceId.month, tier.priceId.year]) {
      if (priceId && !seen.has(priceId)) {
        seen.add(priceId);
        items.push({ priceId, quantity: 1 });
      }
    }
  }

  return items;
}

/**
 * Extract priceId → formattedTotals.total from the PricePreview response.
 * formattedTotals.total is already locale-formatted by Paddle (e.g. "$6.00",
 * "€5,40", "¥800") — do not reformat.
 */
function getPriceAmounts(prices: PricePreviewResponse): PaddlePrices {
  return prices.data.details.lineItems.reduce<PaddlePrices>((acc, item) => {
    acc[item.price.id] = item.formattedTotals.total;
    return acc;
  }, {});
}

/**
 * Fetch localized prices from Paddle.PricePreview for a given country.
 *
 * @param paddle - Initialized Paddle instance (from initializePaddle)
 * @param country - ISO 3166-1 alpha-2 country code, or "OTHERS" to let
 *                  Paddle infer from IP (omit address field).
 * @returns { prices, loading } — prices is a map of priceId → formatted string
 */
export function usePaddlePrices(
  paddle: Paddle | undefined,
  country: string,
): { prices: PaddlePrices; loading: boolean } {
  const [prices, setPrices] = useState<PaddlePrices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paddle) return;

    const items = getLineItems();
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    const params: Partial<PricePreviewParams> = {
      items,
    };

    // "OTHERS" is a sentinel meaning "don't pass an address" — Paddle
    // infers the country from IP. Never pass "OTHERS" as a countryCode.
    if (country && country !== "OTHERS") {
      params.address = { countryCode: country };
    }

    setLoading(true);
    paddle
      .PricePreview(params as PricePreviewParams)
      .then((response) => {
        setPrices((prev) => ({ ...prev, ...getPriceAmounts(response) }));
        setLoading(false);
      })
      .catch(() => {
        // PricePreview failed — fall back to hardcoded prices.
        // The UI will show static USD prices instead of localized ones.
        setLoading(false);
      });
  }, [country, paddle]);

  return { prices, loading };
}
