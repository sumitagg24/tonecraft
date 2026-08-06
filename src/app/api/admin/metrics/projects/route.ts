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

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      emoji: true,
      color: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { chats: true, personas: true, knowledgeFiles: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const projectIds = projects.map((p) => p.id);

  const [messageCount, usageAgg] = await Promise.all([
    prisma.message.count({
      where: { chat: { projectId: { in: projectIds } } },
    }),
    prisma.usageRecord.aggregate({
      _sum: { tokens: true },
      _count: { id: true },
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: since },
      },
    }),
  ]);

  return ok({
    totalProjects: projects.length,
    totalMessages: messageCount,
    aiUsage: {
      tokens: usageAgg._sum.tokens ?? 0,
      requests: usageAgg._count.id ?? 0,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      archived: p.archived,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      stats: {
        chats: p._count.chats,
        personas: p._count.personas,
        knowledgeFiles: p._count.knowledgeFiles,
      },
    })),
    period,
  });
});
