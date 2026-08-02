import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const userId = ctx.user.id;
  const period = ctx.request.nextUrl.searchParams.get("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [usage, records, subscription] = await Promise.all([
    prisma.usage.findUnique({ where: { userId } }),
    prisma.usageRecord.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const totalMessages = usage?.messagesSent ?? 0;
  const totalTokens = usage?.tokensUsed ?? 0;
  const totalFiles = usage?.filesUploaded ?? 0;
  const totalStorage = usage?.storageUsed ?? 0;

  const successRecords = records.filter((r) => r.success);
  const errorRecords = records.filter((r) => !r.success);

  const avgLatency =
    successRecords.length > 0
      ? Math.round(successRecords.reduce((sum, r) => sum + (r.latency ?? 0), 0) / successRecords.length)
      : 0;

  const errorRate = records.length > 0 ? (errorRecords.length / records.length) * 100 : 0;

  const modelUsage = records.reduce(
    (acc, r) => {
      acc[r.model] = (acc[r.model] ?? 0) + (r.tokens ?? 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const providerUsage = records.reduce(
    (acc, r) => {
      acc[r.provider] = (acc[r.provider] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return ok({
    period,
    totalMessages,
    totalTokens,
    totalFiles,
    totalStorage,
    avgLatency,
    errorRate: Math.round(errorRate * 10) / 10,
    modelUsage,
    providerUsage,
    subscription: subscription
      ? { plan: subscription.plan, status: subscription.status }
      : null,
    dailyBreakdown: records
      .slice(0, 30)
      .map((r) => ({
        date: r.createdAt.toISOString().slice(0, 10),
        tokens: r.tokens ?? 0,
        latency: r.latency ?? 0,
        success: r.success,
        model: r.model,
      })),
  });
});
