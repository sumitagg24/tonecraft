import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { parseMoney } from "@/lib/parse-money";

export interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  amount: string;
  currency: string;
  status: "paid" | "pending" | "refunded";
  pdfUrl?: string;
  description: string;
}

const api = withApiHandler();

/**
 * GET /api/billing/invoices — real Paddle invoices for the authenticated
 * user. Uses paddle.transactions.list() with the mandatory customerId
 * filter. Only returns transactions that have been billed/paid (not
 * draft/ready states).
 *
 * @see paddle-billing-history skill for the customerId security guarantee.
 */
export const GET = api.GET(async (ctx) => {
  // 1. Get the user's Paddle customer ID.
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerCustomerId: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerCustomerId) {
    return ok({ invoices: [] });
  }

  // 2. Initialize Paddle SDK.
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    return ok({ invoices: [] });
  }
  const paddle = new Paddle(apiKey, {
    environment: apiKey.startsWith("pdl_sdbx_")
      ? Environment.sandbox
      : Environment.production,
  });

  // 3. List transactions scoped to this customer — only billed/paid/completed
  //    statuses produce invoices.
  const customerId = user.subscription.providerCustomerId;
  const collection = paddle.transactions.list({
    customerId: [customerId],
    status: ["billed", "paid", "completed"],
    perPage: 20,
  });

  const transactions = (await collection.next()) ?? [];

  // 4. Map to invoice DTOs. Use invoiceNumber if available, else generate
  //    from transaction ID. Invoice PDF URL comes from the invoiceId.
  const invoices: InvoiceItem[] = transactions.map((t) => ({
    id: t.id,
    number: t.invoiceNumber ?? `TXN-${t.id.slice(-8).toUpperCase()}`,
    date: t.billedAt
      ? new Date(t.billedAt).toISOString().split("T")[0]
      : t.createdAt
        ? new Date(t.createdAt).toISOString().split("T")[0]
        : "—",
    amount: parseMoney(t.details?.totals?.total ?? "0", t.currencyCode ?? "USD"),
    currency: t.currencyCode ?? "USD",
    status: mapInvoiceStatus(t.status),
    pdfUrl: t.invoiceId
      ? `https://sandbox.paddle.com/invoice/${t.invoiceId}`
      : undefined,
    description:
      typeof t.customData?.plan === "string"
        ? `ToneCraft ${t.customData.plan.charAt(0).toUpperCase() + t.customData.plan.slice(1)} Subscription`
        : t.items?.[0]?.price?.name ??
          "ToneCraft Subscription",
  } as InvoiceItem));

  return ok({ invoices });
});

function mapInvoiceStatus(
  status: string,
): "paid" | "pending" | "refunded" {
  switch (status) {
    case "billed":
    case "paid":
    case "completed":
      return "paid";
    case "canceled":
      return "refunded";
    default:
      return "pending";
  }
}
