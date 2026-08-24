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
  | "subscription.paused"
  | "subscription.payment_succeeded"
  | "subscription.payment_failed"
  | "ignored";

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

export type ProrationBillingMode =
  | "prorated_immediately"
  | "prorated_next_billing_period"
  | "full_immediately"
  | "full_next_billing_period"
  | "do_not_bill";

export interface SubscriptionChangeInput {
  subscriptionId: string;
  newPriceId: string;
  prorationBillingMode: ProrationBillingMode;
}

export interface SubscriptionPreviewResult {
  immediateTransaction: {
    total: string;
    currencyCode: string;
  } | null;
  recurringTransactionDetails: {
    total: string;
    currencyCode: string;
  } | null;
  nextBilledAt: string | null;
}

export interface RefundInput {
  transactionId: string;
  amount?: string;
  reason: string;
}

export interface PortalSessionDeepLink {
  subscriptionId: string;
  cancelUrl?: string;
  updatePaymentMethodUrl?: string;
}

export interface PortalSessionResult {
  url: string;
  deepLinks?: PortalSessionDeepLink[];
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
