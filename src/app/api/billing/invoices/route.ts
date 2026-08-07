import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

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

export const GET = api.GET(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      id: true,
      createdAt: true,
      subscription: {
        select: {
          id: true,
          status: true,
          plan: true,
          createdAt: true,
          currentPeriodStart: true,
        },
      },
    },
  });

  const invoices: InvoiceItem[] = [];

  if (user?.subscription && user.subscription.plan !== "free") {
    const planName = user.subscription.plan.toUpperCase();
    const amount = user.subscription.plan === "pro" ? "$6.00" : "$15.00";
    const subDate = user.subscription.currentPeriodStart ?? user.subscription.createdAt;

    invoices.push({
      id: `inv_${user.subscription.id.slice(-8)}`,
      number: `INV-${new Date(subDate).getFullYear()}-${user.subscription.id.slice(-4).toUpperCase()}`,
      date: new Date(subDate).toISOString().split("T")[0],
      amount,
      currency: "USD",
      status: user.subscription.status === "active" || user.subscription.status === "trialing" ? "paid" : "pending",
      pdfUrl: "#",
      description: `ToneCraft ${planName} Plan - Monthly`,
    });
  }

  return ok({ invoices });
});
