import type { PaymentProvider } from "../PaymentProvider";
import { NoopPaymentProvider } from "./noop/NoopPaymentProvider";
import { PaddleProvider } from "./paddle/PaddleProvider";

export type ProviderName = "noop" | "paddle";

/**
 * Lazily-constructed providers, cached after first use.
 *
 * IMPORTANT: providers must NOT be constructed at module scope — the Paddle
 * client constructor throws when PADDLE_API_KEY is absent, and next build
 * collects page data for routes that import this module (e.g.
 * /api/billing/webhook). Deferring construction keeps importing safe while
 * PADDLE_API_KEY remains required the moment a billing method actually runs.
 */
const providerCache = new Map<string, PaymentProvider>();

function createProvider(name: string): PaymentProvider {
  switch (name) {
    case "paddle":
      return new PaddleProvider();
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
