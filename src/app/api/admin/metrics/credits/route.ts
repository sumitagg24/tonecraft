import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin, resolveMetricsPeriod } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;
  const { period, since } = resolveMetricsPeriod(ctx);

  const [usageAgg, dailyUsage, memberCredits] = await Promise.all([
    prisma.usageRecord.aggregate({
      _sum: { tokens: true },
      _count: { id: true },
      _avg: { latency: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.$queryRaw<
      Array<{ date: string; tokens: number; requests: number }>
    >`
      SELECT
        to_char("createdAt", 'YYYY-MM-DD') as date,
        SUM(tokens) as tokens,
        COUNT(*)::int as requests
      FROM "UsageRecord"
      WHERE "createdAt" >= ${since}
      GROUP BY to_char("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `,
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      select: {
        userId: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ]);

  return ok({
    credits: {
      totalTokens: usageAgg._sum.tokens ?? 0,
      totalRequests: usageAgg._count.id ?? 0,
      avgLatency: usageAgg._avg.latency ?? 0,
    },
    dailyUsage,
    members: memberCredits,
    period,
  });
});
