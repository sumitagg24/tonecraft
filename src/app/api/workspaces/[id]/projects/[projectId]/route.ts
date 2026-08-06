import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id, projectId } = ctx.params;

  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: id },
    include: { members: true, _count: { select: { chats: true } } },
  });

  if (!project) return notFound();
  return ok(project);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id, projectId } = ctx.params;
  const { name, description, color, emoji, archived } = body as {
    name?: string;
    description?: string;
    color?: string;
    emoji?: string;
    archived?: boolean;
  };

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin to update projects", 403);

  const result = await prisma.project.updateMany({
    where: { id: projectId, workspaceId: id },
    data: { name, description, color, emoji, archived, updatedAt: new Date() },
  });

  if (result.count === 0) return notFound();

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "project_update",
    payload: { projectId, changes: { name, description, color, emoji, archived } },
  });

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id, projectId } = ctx.params;

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can delete projects", 403);

  // Move chats to Unfiled before deletion
  await prisma.chat.updateMany({
    where: { projectId, userId: ctx.user.id },
    data: { projectId: null },
  });

  const result = await prisma.project.deleteMany({
    where: { id: projectId, workspaceId: id },
  });

  if (result.count === 0) return notFound();

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "project_delete",
    payload: { projectId },
  });

  return ok({ ok: true });
});