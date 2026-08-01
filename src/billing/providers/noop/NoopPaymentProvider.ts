import type { PaymentProvider } from "../../PaymentProvider";
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
} from "../../types";

export class NoopPaymentProvider implements PaymentProvider {
  async createCustomer(input: CustomerInput): Promise<CustomerResult> {
    void input;
    return { customerId: "" };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    void input;
    return { url: "" };
  }

  async verifyWebhook(payload: WebhookPayload): Promise<unknown> {
    void payload;
    return null;
  }

  async handleWebhookEvent(event: unknown): Promise<WebhookEvent> {
    void event;
    return { type: "subscription.updated", data: {} };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    void subscriptionId;
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    void subscriptionId;
    return {
      id: "",
      customerId: "",
      status: "inactive",
      plan: "free",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      metadata: {},
    };
  }

  async upgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    void input;
  }

  async downgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    void input;
  }

  async refundTransaction(input: RefundInput): Promise<void> {
    void input;
  }

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    void customerId;
    return { url: "" };
  }

  async listProducts(): Promise<ProductInfo[]> {
    return [];
  }

  async listPrices(): Promise<PriceInfo[]> {
    return [];
  }
}