import type { PaymentProvider } from "../PaymentProvider";
import { NoopPaymentProvider } from "./noop/NoopPaymentProvider";
import { DodoProvider } from "./dodo/DodoProvider";

export type ProviderName = "noop" | "dodo";

/**
 * Lazily-constructed providers, cached after first use.
 *
 * IMPORTANT: providers must NOT be constructed at module scope — the provider
 * client constructor throws when DODO_PAYMENTS_API_KEY is absent, and next build
 * collects page data for routes that import this module (e.g.
 * /api/billing/webhook). Deferring construction keeps importing safe while
 * DODO_PAYMENTS_API_KEY remains required the moment a billing method actually runs.
 */
const providerCache = new Map<string, PaymentProvider>();

function createProvider(name: string): PaymentProvider {
  switch (name) {
    case "dodo":
      return new DodoProvider();
    case "noop":
      return new NoopPaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${name}`);
  }
}

export function getProvider(name: string = "noop"): PaymentProvider {
  let provider = providerCache.get(name);
  if (!provider) {
    provider = createProvider(name);
    providerCache.set(name, provider);
  }
  return provider;
}
