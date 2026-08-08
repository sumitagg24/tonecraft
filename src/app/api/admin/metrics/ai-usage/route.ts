import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceService } from "@/services/WorkspaceService";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { modelTierLabel, providerLabel } from "@/lib/ai-labels";

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

  const projects = await workspaceService.getWorkspaceProjects(workspaceId, ctx.user.id);
  const projectIds = projects.map((p) => p.id);

  const usageWhere = {
    workspaceId,
    createdAt: { gte: since },
    ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : {}),
  };

  const [overview, byModel, byProvider, successAgg, dailyUsage, errorDetails] = await Promise.all([
    prisma.usageRecord.aggregate({
      _sum: { tokens: true },
      _count: { id: true },
      _avg: { latency: true },
      _min: { latency: true },
      _max: { latency: true },
      where: usageWhere,
    }),
    prisma.usageRecord.groupBy({
      by: ["model"],
      _sum: { tokens: true },
      _count: { id: true },
      where: usageWhere,
      orderBy: { _sum: { tokens: "desc" } },
    }),
    prisma.usageRecord.groupBy({
      by: ["provider"],
      _count: { id: true },
      where: usageWhere,
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.usageRecord.aggregate({
      _count: { id: true },
      where: { ...usageWhere, success: false },
    }),
    prisma.$queryRaw<
      Array<{ date: string; tokens: number; requests: number; errors: number }>
    >`
      SELECT
        to_char("createdAt", 'YYYY-MM-DD') as date,
        SUM(CASE WHEN "success" THEN "tokens" ELSE 0 END)::int as tokens,
        COUNT(*)::int as requests,
        COUNT(CASE WHEN NOT "success" THEN 1 END)::int as errors
      FROM "UsageRecord"
      WHERE "workspaceId" = ${workspaceId}
        AND "createdAt" >= ${since}
      GROUP BY to_char("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `,
    prisma.usageRecord.findMany({
      where: { ...usageWhere, success: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        provider: true,
        model: true,
        error: true,
        tokens: true,
        latency: true,
        createdAt: true,
      },
    }),
  ]);

  const totalRequests = overview._count.id ?? 0;
  const errorCount = successAgg._count.id ?? 0;

  return ok({
    period,
    overview: {
      totalTokens: overview._sum.tokens ?? 0,
      totalRequests,
      avgLatency: Math.round(overview._avg.latency ?? 0),
      minLatency: overview._min.latency ?? 0,
      maxLatency: overview._max.latency ?? 0,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    },
    byModel: byModel.map((m) => ({
      model: modelTierLabel(m.model),
      tokens: m._sum.tokens ?? 0,
      calls: m._count.id ?? 0,
    })),
    byProvider: byProvider.map((p) => ({
      provider: providerLabel(p.provider),
      calls: p._count.id ?? 0,
    })),
    dailyUsage,
    errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 1000) / 10 : 0,
    recentErrors: errorDetails.map((e) => ({
      ...e,
      provider: providerLabel(e.provider),
      model: modelTierLabel(e.model),
    })),
  });
});
