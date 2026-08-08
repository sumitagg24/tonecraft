/**
 * Neutral display labels for internal AI model/provider identifiers.
 *
 * ToneCraft deliberately never reveals which third-party model (or whose
 * infrastructure) produced a result. These helpers map raw internal
 * identifiers to opaque tier labels anywhere a label must be shown — so
 * "gemini-2.5-pro" becomes "Premium Model" and "google" becomes "Cloud AI".
 */

const TIER_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /flash|haiku|nano|mini-lite/i, label: "Fast Model" },
  { re: /pro|opus|ultra|max|turbo|large|sonnet/i, label: "Premium Model" },
  { re: /mini|small|medium|light/i, label: "Standard Model" },
  { re: /local|tonecraft/i, label: "ToneCraft Engine" },
];

export function modelTierLabel(model: string | null | undefined): string {
  if (!model) return "AI Model";
  for (const { re, label } of TIER_RULES) {
    if (re.test(model)) return label;
  }
  return "AI Model";
}

export function providerLabel(provider: string | null | undefined): string {
  if (!provider) return "AI";
  if (/local|tonecraft/i.test(provider)) return "ToneCraft Engine";
  return "Cloud AI";
}
