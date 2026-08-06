import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  const period = ctx.request.nextUrl.searchParams.get("period") || "30d";

  if (!workspaceId) {
    return fail("BAD_REQUEST", "workspaceId is required", 400);
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
