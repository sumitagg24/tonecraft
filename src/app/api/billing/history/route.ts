import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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
 * GET /api/billing/history — payment history for the authenticated user.
 * Uses Dodo Payments API to list payments.
 */
export const GET = api.GET(async (ctx) => {
  // 1. Get the user's subscription info.
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerCustomerId: true,
          providerSubscriptionId: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerCustomerId) {
    return ok({ history: [] });
  }

  // 2. Fetch payments from Dodo Payments API.
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return ok({ history: [] });
  }

  const environment =
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
      ? "live_mode"
      : "test_mode";

  const baseUrl =
    environment === "live_mode"
      ? "https://live.dodopayments.com"
      : "https://test.dodopayments.com";

  try {
    const response = await fetch(`${baseUrl}/payments?page_number=1&page_size=20`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      logger.error("Failed to fetch Dodo payments", { status: response.status });
      return ok({ history: [] });
    }

    const data = await response.json();
    const payments = data.items || [];

    // 3. Slim each payment to what the UI renders.
    const history: PaymentHistoryItem[] = payments.map((p: Record<string, unknown>) => ({
      id: (p.payment_id as string) || "",
      date: p.created_at
        ? new Date(p.created_at as string).toISOString().split("T")[0]
        : "—",
      description: `ToneCraft ${(user.subscription?.plan || "pro").charAt(0).toUpperCase() + (user.subscription?.plan || "pro").slice(1)} Subscription`,
      amount: "$" + String(((p.amount as number) || 0) / 100),
      paymentMethod: "Card",
      status: p.status === "succeeded" ? "succeeded" : p.status === "failed" ? "failed" : "pending",
      invoiceUrl: p.payment_id ? `${baseUrl}/invoice/${p.payment_id}` : undefined,
    }));

    return ok({ history });
  } catch (err) {
    logger.error("Failed to fetch payment history", { error: String(err) });
    return ok({ history: [] });
  }
});
