import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { parseMoney } from "@/lib/parse-money";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  paymentMethod: string;
  status: "succeeded" | "failed" | "pending";
  invoiceUrl?: string;
}

const api = withApiHandler();

/**
 * GET /api/billing/history — real Paddle transaction history for the
 * authenticated user. Uses paddle.transactions.list() with the mandatory
 * customerId filter (security guarantee — without it, returns ALL
 * transactions in the account).
 *
 * @see paddle-billing-history skill for full rationale.
 */
export const GET = api.GET(async (ctx) => {
  // 1. Get the user's Paddle customer ID from the subscription record.
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerCustomerId: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerCustomerId) {
    // No Paddle customer yet — return empty history, not an error.
    return ok({ history: [] });
  }

  // 2. Initialize Paddle SDK (same pattern as PaddleProvider).
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return ok({ history: [] });
  }
  const paddle = new Paddle(apiKey, {
    environment: apiKey.startsWith("pdl_sdbx_")
      ? Environment.sandbox
      : Environment.production,
  });

  // 3. List transactions scoped to this customer only.
  //    Status filter excludes internal states (draft, ready) that
  //    customers shouldn't see.
  const customerId = user.subscription.providerCustomerId;
  const collection = paddle.transactions.list({
    customerId: [customerId],
    status: ["billed", "paid", "past_due", "completed", "canceled"],
    perPage: 20,
  });

  const transactions = (await collection.next()) ?? [];

  // 4. Slim each transaction to what the UI renders. Use details.totals.total
  //    (precomputed by Paddle, includes tax/discounts) — never re-sum line
  //    items manually.
  const history: PaymentHistoryItem[] = transactions.map((t) => ({
    id: t.id,
    date: t.billedAt
      ? new Date(t.billedAt).toISOString().split("T")[0]
      : t.createdAt
        ? new Date(t.createdAt).toISOString().split("T")[0]
        : "—",
    description: describeTransaction(t),
    amount: parseMoney(t.details?.totals?.total ?? "0", t.currencyCode ?? "USD"),
    paymentMethod: inferPaymentMethod(t),
    status: mapTransactionStatus(t.status),
    invoiceUrl: t.invoiceId
      ? `${process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "https://www.paddle.com" : "https://sandbox.paddle.com"}/invoice/${t.invoiceId}`
      : undefined,
  } as PaymentHistoryItem));

  return ok({ history });
});

/**
 * Map Paddle TransactionStatus to the client-friendly status union.
 */
function mapTransactionStatus(
  status: string,
): "succeeded" | "failed" | "pending" {
  switch (status) {
    case "billed":
    case "paid":
    case "completed":
      return "succeeded";
    case "past_due":
      return "failed";
    case "canceled":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Build a human-readable description from the transaction's custom data
 * or line items. Transaction has no top-level description field — use
 * the first line item's price name or custom data.
 */
function describeTransaction(t: { customData?: Record<string, any> | null; items?: { price?: { name?: string | null } | null }[] }): string {
  // Check custom data for a plan name (set during checkout).
  const plan = t.customData?.plan;
  if (typeof plan === "string") {
    return `ToneCraft ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`;
  }
  // Fall back to the first line item's price name.
  const firstName = t.items?.[0]?.price?.name;
  if (firstName) return firstName;
  return "Payment";
}

/**
 * Infer payment method from the transaction's payment attempts.
 * payments is an array of TransactionPaymentAttempt objects with
 * methodDetails.type (PaymentType enum).
 */
function inferPaymentMethod(t: { payments?: { methodDetails?: { type?: string } | null }[] }): string {
  const lastAttempt = t.payments?.[t.payments.length - 1];
  const methodType = lastAttempt?.methodDetails?.type;
  if (methodType === "card") return "Card";
  if (methodType === "paypal") return "PayPal";
  if (methodType === "apple_pay") return "Apple Pay";
  if (methodType === "google_pay") return "Google Pay";
  return "Paddle";
}
