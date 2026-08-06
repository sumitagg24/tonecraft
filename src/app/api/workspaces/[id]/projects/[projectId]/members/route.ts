import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id, projectId } = ctx.params;

  const isMember = await permissionMiddleware.isWorkspaceMember(id, ctx.user.id);
  if (!isMember) return fail("FORBIDDEN", "You are not a member of this workspace", 403);

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return ok(members);
});

export const POST = api.POST(async (ctx, body) => {
  const { id, projectId } = ctx.params;
  const { userId, role } = body as { userId: string; role?: string };

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin", 403);

  const member = await prisma.projectMember.create({
    data: { projectId, userId, role: role || "viewer" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "project_member_added", projectId, userId },
  });

  return ok(member, 201);
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id, projectId, userId } = ctx.params;

  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "manager");
  if (check === "none") return fail("FORBIDDEN", "You must be a manager or admin", 403);

  const result = await prisma.projectMember.deleteMany({
    where: { projectId, userId },
  });

  if (result.count === 0) return notFound();

  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "project_member_removed", projectId, userId },
  });

  return ok({ ok: true });
});