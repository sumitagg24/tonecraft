import type { PaymentProvider } from "./PaymentProvider";
import { getProvider, type ProviderName } from "./providers";
import type {
  CustomerInput,
  CustomerResult,
  CheckoutInput,
  CheckoutResult,
  WebhookPayload,
  WebhookEvent,
  SubscriptionInfo,
  SubscriptionChangeInput,
  RefundInput,
  PortalSessionResult,
  ProductInfo,
  PriceInfo,
} from "./types";

export class BillingService {
  private provider: PaymentProvider;
  private providerName: ProviderName;

  constructor(providerName: ProviderName = "noop") {
    this.providerName = providerName;
    this.provider = getProvider(providerName);
  }

  async createCustomer(input: CustomerInput): Promise<CustomerResult> {
    return this.provider.createCustomer(input);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return this.provider.createCheckout(input);
  }

  async verifyWebhook(payload: WebhookPayload): Promise<unknown> {
    return this.provider.verifyWebhook(payload);
  }

  async handleWebhookEvent(event: unknown): Promise<WebhookEvent> {
    return this.provider.handleWebhookEvent(event);
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    return this.provider.cancelSubscription(subscriptionId);
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    return this.provider.getSubscription(subscriptionId);
  }

  async upgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    return this.provider.upgradeSubscription(input);
  }

  async downgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    return this.provider.downgradeSubscription(input);
  }

  async refundTransaction(input: RefundInput): Promise<void> {
    return this.provider.refundTransaction(input);
  }

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    return this.provider.createPortalSession(customerId);
  }

  async listProducts(): Promise<ProductInfo[]> {
    return this.provider.listProducts();
  }

  async listPrices(): Promise<PriceInfo[]> {
    return this.provider.listPrices();
  }

  getProviderName(): ProviderName {
    return this.providerName;
  }
}

export const billingService = new BillingService("paddle");