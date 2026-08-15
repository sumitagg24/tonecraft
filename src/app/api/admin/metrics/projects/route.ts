import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin, resolveMetricsPeriod } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;
  const { period, since } = resolveMetricsPeriod(ctx);

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
