import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { workspaceRepository } from "@/repositories/WorkspaceRepository";

const api = withApiHandler();

/**
 * Phase 16 — Workspace analytics.
 * Team productivity, tasks, knowledge usage. Requires a workspace
 * the user belongs to (either owned or a member of).
 */
export const GET = api.GET(async (ctx) => {
  const userId = ctx.user.id;
  const url = ctx.request.nextUrl;
  const period = url.searchParams.get("period") || "30d";
  const workspaceId = url.searchParams.get("workspaceId");

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Resolve the workspace the user can see.
  let target = workspaceId ?? null;
  if (!target) {
    const owned = await prisma.workspace.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    target = owned?.id ?? null;
  }
  if (!target) {
    const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
    target = membership?.workspaceId ?? null;
  }
  if (!target) return ok({ error: "NO_WORKSPACE", message: "No workspace found for this user" }, 404);

  const isMember = await workspaceRepository.isMember(target, userId);
  if (!isMember) return ok({ error: "FORBIDDEN", message: "Not a member of this workspace" }, 403);

  const [members, projects, messages, tasks, knowledgeFiles] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId: target } }),
    prisma.project.count({ where: { workspaceId: target, archived: false } }),
    prisma.message.count({
      where: { chat: { project: { workspaceId: target }, createdAt: { gte: since } } },
    }),
    prisma.task.count({ where: { user: { workspaces: { some: { id: target } } }, createdAt: { gte: since } } }),
    prisma.knowledgeFile.count({ where: { project: { workspaceId: target } } }),
  ]);

  return ok({
    period,
    workspaceId: target,
    members,
    projects,
    messages,
    tasks,
    knowledgeFiles,
  });
});
