import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: string;
  paymentMethod: string;
  status: "succeeded" | "failed" | "pending";
}

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: {
      id: true,
      subscription: {
        select: {
          id: true,
          status: true,
          plan: true,
          createdAt: true,
          currentPeriodStart: true,
          paymentProvider: true,
        },
      },
      auditLogs: {
        where: {
          action: {
            in: ["billing.subscribe", "billing.unsubscribe", "billing.payment_method_update"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  const history: PaymentHistoryItem[] = [];

  if (user?.subscription && user.subscription.plan !== "free") {
    const planName = user.subscription.plan.toUpperCase();
    const amount = user.subscription.plan === "pro" ? "$6.00" : "$15.00";
    const subDate = user.subscription.currentPeriodStart ?? user.subscription.createdAt;

    history.push({
      id: `tx_${user.subscription.id.slice(-8)}`,
      date: new Date(subDate).toISOString().split("T")[0],
      description: `ToneCraft ${planName} Subscription`,
      amount,
      paymentMethod: user.subscription.paymentProvider === "paddle" ? "Card / Paddle" : "Credit Card",
      status: user.subscription.status === "active" || user.subscription.status === "trialing" ? "succeeded" : "pending",
    });
  }

  // Include billing audit logs as payment history events if any exist
  if (user?.auditLogs) {
    for (const log of user.auditLogs) {
      if (!history.some((h) => h.id === `log_${log.id.slice(-8)}`)) {
        history.push({
          id: `log_${log.id.slice(-8)}`,
          date: new Date(log.createdAt).toISOString().split("T")[0],
          description: log.action.replace("billing.", "Billing Event: "),
          amount: "-",
          paymentMethod: "Account Action",
          status: "succeeded",
        });
      }
    }
  }

  return ok({ history });
});
