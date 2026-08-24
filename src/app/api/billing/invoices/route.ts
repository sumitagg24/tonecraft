import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: string;
  currency: string;
  status: "paid" | "pending" | "failed";
  pdfUrl?: string;
  description: string;
}

const api = withApiHandler();

/**
 * GET /api/billing/invoices — invoice history for the authenticated user.
 * Uses Dodo Payments API to list payments as invoices.
 */
export const GET = api.GET(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      subscription: {
        select: {
          providerCustomerId: true,
          plan: true,
        },
      },
    },
  });

  if (!user?.subscription?.providerCustomerId) {
    return ok({ invoices: [] });
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return ok({ invoices: [] });
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
      return ok({ invoices: [] });
    }

    const data = await response.json();
    const payments = data.items || [];

    const invoices: InvoiceItem[] = payments.map((p: Record<string, unknown>) => ({
      id: (p.payment_id as string) || "",
      invoiceNumber: `INV-${(p.payment_id as string)?.slice(-8)?.toUpperCase() || "00000000"}`,
      date: p.created_at
        ? new Date(p.created_at as string).toISOString().split("T")[0]
        : "—",
      amount: "$" + String(((p.amount as number) || 0) / 100),
      currency: (p.currency as string) || "USD",
      status: p.status === "succeeded" ? "paid" : p.status === "failed" ? "failed" : "pending",
      pdfUrl: p.payment_id ? `${baseUrl}/invoice/${p.payment_id}` : undefined,
      description:
        typeof p.plan === "string"
          ? `ToneCraft ${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} Subscription`
          : `ToneCraft ${(user.subscription?.plan || "pro").charAt(0).toUpperCase() + (user.subscription?.plan || "pro").slice(1)} Subscription`,
    }));

    return ok({ invoices });
  } catch (err) {
    logger.error("Failed to fetch invoices", { error: String(err) });
    return ok({ invoices: [] });
  }
});
