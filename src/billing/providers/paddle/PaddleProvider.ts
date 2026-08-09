import { Paddle, Environment } from "@paddle/paddle-node-sdk";
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
import { logger } from "@/lib/logger";

export class PaddleProvider implements PaymentProvider {
  private paddle: Paddle;

  constructor() {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) throw new Error("Missing PADDLE_API_KEY environment variable");
    // Environment follows the KEY, not NODE_ENV: a sandbox key (pdl_sdbx_…)
    // only authenticates against sandbox-api.paddle.com. Previously NODE_ENV
    // drove this, so a production deploy with a sandbox key hit the live API
    // and every checkout returned 401.
    this.paddle = new Paddle(apiKey, {
      environment: apiKey.startsWith("pdl_sdbx_")
        ? Environment.sandbox
        : Environment.production,
    });
  }

  async createCustomer(input: CustomerInput): Promise<CustomerResult> {
    const customer = await this.paddle.customers.create({
      email: input.email,
      name: input.name,
    });
    return { customerId: customer.id };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const transaction = await this.paddle.transactions.create({
      items: [{ priceId: input.priceId, quantity: 1 }],
      customerId: input.customerId,
      customData: {
        userId: input.userId,
        ...(input.metadata ?? {}),
      } as Record<string, string>,
    });
    const url = transaction.checkout?.url;
    if (!url) throw new Error("Paddle did not return a checkout URL");
    return { url };
  }

  async verifyWebhook(payload: WebhookPayload): Promise<unknown> {
    const signature = payload.headers["paddle-signature"];
    if (!signature) throw new Error("Missing paddle-signature header");
    const secretKey = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secretKey) throw new Error("Missing PADDLE_WEBHOOK_SECRET");
    return this.paddle.webhooks.unmarshal(payload.body, secretKey, signature);
  }

  async handleWebhookEvent(event: unknown): Promise<WebhookEvent> {
    const ev = event as { eventType?: string; event_type?: string; data?: unknown };
    const rawType = ev.eventType ?? ev.event_type ?? "";
    return { type: this.mapEventType(rawType), data: (ev.data as Record<string, unknown>) ?? {} };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom: "immediately",
    });
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    const sub = await this.paddle.subscriptions.get(subscriptionId);
    return {
      id: sub.id,
      customerId: sub.customerId,
      status: sub.status,
      plan: sub.items[0]?.price?.id ?? "",
      currentPeriodStart: sub.currentBillingPeriod
        ? new Date(sub.currentBillingPeriod.startsAt)
        : null,
      currentPeriodEnd: sub.currentBillingPeriod
        ? new Date(sub.currentBillingPeriod.endsAt)
        : null,
      cancelAtPeriodEnd: sub.scheduledChange?.action === "cancel",
      metadata: (sub.customData as Record<string, string>) ?? {},
    };
  }

  async upgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    await this.paddle.subscriptions.update(input.subscriptionId, {
      items: [{ priceId: input.newPriceId, quantity: 1 }],
      prorationBillingMode: this.mapProrationMode(input.prorationBillingMode),
    });
  }

  async downgradeSubscription(input: SubscriptionChangeInput): Promise<void> {
    await this.paddle.subscriptions.update(input.subscriptionId, {
      items: [{ priceId: input.newPriceId, quantity: 1 }],
      prorationBillingMode: this.mapProrationMode(input.prorationBillingMode),
    });
  }

  async refundTransaction(input: RefundInput): Promise<void> {
    const transaction = await this.paddle.transactions.get(input.transactionId);
    const items = transaction.items.map((item) => ({
      itemId: item.price?.id ?? "",
      type: "partial" as const,
      amount: input.amount ?? null,
    }));
    await this.paddle.adjustments.create({
      action: "refund",
      transactionId: input.transactionId,
      reason: input.reason,
      items,
      type: input.amount ? "partial" : "full",
    });
  }

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    const session = await this.paddle.customerPortalSessions.create(
      customerId,
      []
    );
    return { url: session.urls.general.overview };
  }

  async listProducts(): Promise<ProductInfo[]> {
    const result: ProductInfo[] = [];
    for await (const product of this.paddle.products.list({
      status: ["active"],
    })) {
      result.push({
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        active: true,
      });
    }
    return result;
  }

  async listPrices(): Promise<PriceInfo[]> {
    const result: PriceInfo[] = [];
    for await (const price of this.paddle.prices.list({ status: ["active"] })) {
      result.push({
        id: price.id,
        productId: price.productId,
        name: price.name ?? null,
        description: price.description,
        unitPrice: {
          amount: price.unitPrice.amount,
          currencyCode: price.unitPrice.currencyCode,
        },
        billingCycle: price.billingCycle
          ? {
              interval: price.billingCycle.interval,
              frequency: price.billingCycle.frequency,
            }
          : null,
        trialPeriod: price.trialPeriod
          ? {
              interval: price.trialPeriod.interval,
              frequency: price.trialPeriod.frequency,
            }
          : null,
        active: price.status === "active",
      });
    }
    return result;
  }

  private mapEventType(raw: string): WebhookEvent["type"] {
    switch (raw) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
        return "subscription.updated";
      case "subscription.canceled":
        return "subscription.cancelled";
      case "transaction.completed":
      case "transaction.paid":
        return "subscription.payment_succeeded";
      case "transaction.payment_failed":
      case "subscription.past_due":
        return "subscription.payment_failed";
      default:
        // Events we don't act on (transaction.created, product.*, customer.*,
        // …) must NOT touch subscriptions — returning "ignored" makes the
        // webhook handler skip the sync entirely. Previously these fell
        // through to "subscription.updated" and could overwrite a user's
        // subscription row with transaction data.
        logger.debug(`Ignoring unmapped Paddle event type: ${raw}`);
        return "ignored";
    }
  }

  private mapProrationMode(
    mode?: "prorated" | "full_immediately" | "do_not_bill"
  ): "prorated_immediately" | "prorated_next_billing_period" | "full_immediately" | "full_next_billing_period" | "do_not_bill" | undefined {
    // ponytail: default to prorated immediately, only the most common modes are mapped
    switch (mode) {
      case "prorated":
        return "prorated_immediately";
      case "full_immediately":
        return "full_immediately";
      case "do_not_bill":
        return "do_not_bill";
      default:
        return undefined;
    }
  }
}