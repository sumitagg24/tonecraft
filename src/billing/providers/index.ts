import type { PaymentProvider } from "../PaymentProvider";
import { NoopPaymentProvider } from "./noop/NoopPaymentProvider";
import { PaddleProvider } from "./paddle/PaddleProvider";

export type ProviderName = "noop" | "paddle";

const providers: Record<string, PaymentProvider> = {
  noop: new NoopPaymentProvider(),
  paddle: new PaddleProvider(),
};

export function getProvider(name: string = "noop"): PaymentProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown payment provider: ${name}`);
  return provider;
}