import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceService } from "@/services/WorkspaceService";
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

  const workspace = await workspaceService.getWorkspace(workspaceId, ctx.user.id);
  if (!workspace) return fail("NOT_FOUND", "Workspace not found", 404);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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
