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
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<SubscriptionInfo>;
  upgradeSubscription(input: SubscriptionChangeInput): Promise<void>;
  downgradeSubscription(input: SubscriptionChangeInput): Promise<void>;
  refundTransaction(input: RefundInput): Promise<void>;
  createPortalSession(customerId: string): Promise<PortalSessionResult>;
  listProducts(): Promise<ProductInfo[]>;
  listPrices(): Promise<PriceInfo[]>;
}