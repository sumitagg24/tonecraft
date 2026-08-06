import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceMemberRepository } from "@/repositories/WorkspaceMemberRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";
import { memberUpdateSchema } from "../../../workspaceSchema";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id, userId } = ctx.params;
  const { role } = memberUpdateSchema.parse(body);
  
  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can update member roles", 403);
  
  const okResult = await workspaceMemberRepository.updateRole(id, userId, role);
  if (!okResult) return notFound();
  
  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "role_updated", memberId: userId, role },
  });
  
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id, userId } = ctx.params;
  
  const check = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (check !== "admin") return fail("FORBIDDEN", "Only admins can remove members", 403);
  
  const okResult = await workspaceMemberRepository.remove(id, userId);
  if (!okResult) return notFound();
  
  await workspaceActivityRepository.create({
    workspaceId: id,
    userId: ctx.user.id,
    type: "members_status",
    payload: { action: "removed", memberId: userId },
  });
  
  return ok({ ok: true });
});