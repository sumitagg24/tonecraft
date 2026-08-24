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

export interface PaymentProvider {
  createCustomer(input: CustomerInput): Promise<CustomerResult>;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(payload: WebhookPayload): Promise<unknown>;
  handleWebhookEvent(event: unknown): Promise<WebhookEvent>;
  cancelSubscription(subscriptionId: string, effectiveFrom?: "next_billing_period" | "immediately"): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionInfo>;
  updateSubscription(input: SubscriptionChangeInput): Promise<void>;
  previewSubscriptionUpdate(input: SubscriptionChangeInput): Promise<import("./types").SubscriptionPreviewResult>;
  refundTransaction(input: RefundInput): Promise<void>;
  createPortalSession(customerId: string, subscriptionIds?: string[]): Promise<PortalSessionResult>;
  listProducts(): Promise<ProductInfo[]>;
  listPrices(): Promise<PriceInfo[]>;
}