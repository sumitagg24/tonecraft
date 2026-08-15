import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceService } from "@/services/WorkspaceService";
import { requireWorkspaceAdmin, resolveMetricsPeriod } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;
  const { period, since } = resolveMetricsPeriod(ctx);

  const workspace = await workspaceService.getWorkspace(workspaceId, ctx.user.id);
  if (!workspace) return fail("NOT_FOUND", "Workspace not found", 404);

  const projects = await workspaceService.getWorkspaceProjects(workspaceId, ctx.user.id);
  const projectIds = projects.map((p) => p.id);

  const [
    memberCount,
    chatCount,
    messageCount,
    knowledgeCount,
    storageAgg,
    usageAgg,
    activeSubs,
  ] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.chat.count({ where: { projectId: { in: projectIds } } }),
    prisma.message.count({
      where: { chat: { projectId: { in: projectIds } } },
    }),
    prisma.knowledgeFile.count({
      where: { projectId: { in: projectIds } },
    }),
    prisma.knowledgeFile.aggregate({
      _sum: { fileSize: true },
      where: { projectId: { in: projectIds } },
    }),
    prisma.usageRecord.aggregate({
      _sum: { tokens: true },
      _count: { id: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  return ok({
    workspace: { id: workspace.id, name: workspace.name, color: workspace.color },
    members: { total: memberCount },
    projects: { total: projectIds.length },
    chats: { total: chatCount },
    messages: { total: messageCount },
    knowledge: { files: knowledgeCount, storageBytes: storageAgg._sum.fileSize ?? 0 },
    aiUsage: {
      tokens: usageAgg._sum.tokens ?? 0,
      requests: usageAgg._count.id ?? 0,
    },
    billing: { activeSubscriptions: activeSubs },
    period,
    generatedAt: new Date().toISOString(),
  });
});
