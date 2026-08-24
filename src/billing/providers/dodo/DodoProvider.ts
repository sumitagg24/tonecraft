import DodoPayments from "dodopayments";
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
  ProrationBillingMode,
} from "../../types";
import { logger } from "@/lib/logger";

type DodoEnvironment = "live_mode" | "test_mode";

/** Map our ProrationBillingMode to Dodo's. */
function mapProrationMode(mode: ProrationBillingMode): string {
  const map: Record<ProrationBillingMode, string> = {
    prorated_immediately: "prorated_immediately",
    prorated_next_billing_period: "prorated_immediately", // Dodo doesn't have next-period; apply immediately
    full_immediately: "full_immediately",
    full_next_billing_period: "full_immediately",
    do_not_bill: "do_not_bill",
  };
  return map[mode] || "prorated_immediately";
}

export class DodoProvider implements PaymentProvider {
  private client: DodoPayments;
  private environment: DodoEnvironment;

  constructor() {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) throw new Error("Missing DODO_PAYMENTS_API_KEY");

    this.environment =
      (process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
        ? "live_mode"
        : "test_mode") as DodoEnvironment;

    this.client = new DodoPayments({
      bearerToken: apiKey,
      environment: this.environment,
    });

    logger.info("Dodo Payments provider initialized", {
      environment: this.environment,
    });
  }

  async createCustomer(input: CustomerInput): Promise<CustomerResult> {
    return { customerId: `dodo_${input.userId}` };
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const returnUrl =
      input.successUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/welcome`;

    const session = await this.client.checkoutSessions.create({
      product_cart: [{ product_id: input.priceId, quantity: 1 }],
      customer: input.email
        ? { email: input.email, name: input.name || "" }
        : undefined,
      return_url: returnUrl,
      metadata: input.metadata ?? undefined,
    });

    return { url: session.checkout_url || "" };
  }

  async verifyWebhook(payload: WebhookPayload): Promise<unknown> {
    return JSON.parse(payload.body);
  }

  async handleWebhookEvent(event: unknown): Promise<WebhookEvent> {
    const payload = event as {
      type: string;
      data: Record<string, unknown>;
    };

    const typeMap: Record<string, WebhookEvent["type"]> = {
      "payment.succeeded": "subscription.payment_succeeded",
      "payment.failed": "subscription.payment_failed",
      "subscription.active": "subscription.created",
      "subscription.renewed": "subscription.updated",
      "subscription.cancelled": "subscription.cancelled",
      "subscription.on_hold": "subscription.paused",
      "subscription.plan_changed": "subscription.updated",
      "subscription.failed": "subscription.payment_failed",
      "subscription.expired": "subscription.cancelled",
    };

    const normalizedType = typeMap[payload.type] || "ignored";

    const subData = payload.data as Record<string, unknown>;
    const productId =
      (subData.product as Record<string, unknown>)?.product_id || "";

    return {
      type: normalizedType,
      data: {
        id: subData.subscription_id || subData.payment_id || "",
        customer_id: subData.customer_id || "",
        status: subData.status || "",
        items: productId ? [{ price: { id: productId } }] : [],
        current_billing_period: subData.current_period
          ? {
              starts_at: (subData.current_period as Record<string, unknown>)
                .start || null,
              ends_at: (subData.current_period as Record<string, unknown>)
                .end || null,
            }
          : null,
        custom_data: subData.metadata || {},
      },
    };
  }

  /**
   * Cancel a Dodo subscription.
   *
   * - "next_billing_period": set `cancel_at_next_billing_date` → subscription
   *   stays active until the period ends, then status flips to "cancelled".
   * - "immediately": set `status: "cancelled"` on the update → Dodo cancels
   *   right away and fires a `subscription.cancelled` webhook.
   */
  async cancelSubscription(
    subscriptionId: string,
    effectiveFrom: "next_billing_period" | "immediately" = "next_billing_period",
  ): Promise<void> {
    if (effectiveFrom === "immediately") {
      await this.client.subscriptions.update(subscriptionId, {
        status: "cancelled",
        cancel_reason: "cancelled_by_customer",
      });
    } else {
      await this.client.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: true,
        cancel_reason: "cancelled_by_customer",
      });
    }
  }

  async getSubscription(subscriptionId: string): Promise<SubscriptionInfo> {
    const sub = await this.client.subscriptions.retrieve(subscriptionId);
    return {
      id: sub.subscription_id || subscriptionId,
      customerId: sub.customer?.customer_id || "",
      status: sub.status || "active",
      plan: "",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: sub.cancel_at_next_billing_date || false,
      metadata: {},
    };
  }

  /**
   * Change a subscription's plan via Dodo's changePlan API.
   *
   * This replaces the current product with `newPriceId` (which is a Dodo
   * product_id). The proration mode controls when/how the customer is billed
   * for the difference.
   */
  async updateSubscription(input: SubscriptionChangeInput): Promise<void> {
    const prorationBillingMode = mapProrationMode(input.prorationBillingMode);

    logger.info("Updating Dodo subscription plan", {
      subscriptionId: input.subscriptionId,
      newProductId: input.newPriceId,
      prorationBillingMode,
    });

    await this.client.subscriptions.changePlan(input.subscriptionId, {
      product_id: input.newPriceId,
      proration_billing_mode: prorationBillingMode as
        | "prorated_immediately"
        | "full_immediately"
        | "difference_immediately"
        | "do_not_bill",
      quantity: 1,
    });
  }

  async previewSubscriptionUpdate(
    _input: SubscriptionChangeInput,
  ): Promise<import("../../types").SubscriptionPreviewResult> {
    // Dodo doesn't have a preview API — return a placeholder
    return {
      immediateTransaction: null,
      recurringTransactionDetails: null,
      nextBilledAt: null,
    };
  }

  async refundTransaction(input: RefundInput): Promise<void> {
    await this.client.refunds.create({
      payment_id: input.transactionId,
      reason: input.reason || undefined,
    });
  }

  async createPortalSession(
    customerId: string,
    _subscriptionIds: string[] = [],
  ): Promise<PortalSessionResult> {
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/billing?portal=true&customer_id=${customerId}`;
    return { url: portalUrl };
  }

  /**
   * List all products from Dodo's catalog.
   *
   * `products.list()` returns an async-iterable PagePromise — we must iterate
   * it; calling `Array.isArray()` on the promise always returns false.
   */
  async listProducts(): Promise<ProductInfo[]> {
    try {
      const products: ProductInfo[] = [];
      for await (const p of this.client.products.list()) {
        products.push({
          id: p.product_id || "",
          name: p.name || "",
          description: p.description || null,
          active: true,
        });
      }
      return products;
    } catch {
      return [];
    }
  }

  async listPrices(): Promise<PriceInfo[]> {
    // Dodo prices are part of products — not a separate resource
    return [];
  }
}
