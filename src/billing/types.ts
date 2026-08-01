export interface CustomerInput {
  email: string;
  name?: string;
  userId: string;
}

export interface CustomerResult {
  customerId: string;
}

export interface CheckoutInput {
  priceId: string;
  userId: string;
  customerId?: string;
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  url: string;
}

export interface WebhookPayload {
  body: string;
  headers: Record<string, string>;
}

export type WebhookEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.cancelled"
  | "subscription.payment_succeeded"
  | "subscription.payment_failed";

export interface WebhookEvent {
  type: WebhookEventType;
  data: Record<string, unknown>;
}

export interface SubscriptionInfo {
  id: string;
  customerId: string;
  status: string;
  plan: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, string>;
}

export interface SubscriptionChangeInput {
  subscriptionId: string;
  newPriceId: string;
  prorationBillingMode?: "prorated" | "full_immediately" | "do_not_bill";
}

export interface RefundInput {
  transactionId: string;
  amount?: string;
  reason: string;
}

export interface PortalSessionResult {
  url: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface PriceInfo {
  id: string;
  productId: string;
  name: string | null;
  description: string;
  unitPrice: { amount: string; currencyCode: string };
  billingCycle: { interval: string; frequency: number } | null;
  trialPeriod: { interval: string; frequency: number } | null;
  active: boolean;
}
