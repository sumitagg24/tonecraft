import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { workspaceService } from "@/services/WorkspaceService";
import { workspaceUpdateSchema } from "../workspaceSchema";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const workspace = await workspaceService.getWorkspace(id, ctx.user.id);
  if (!workspace) return notFound();
  return ok(workspace);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const { name, description, color, visibility, modes, settings } = workspaceUpdateSchema.parse(body);
  
  const result = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (result !== "admin") return fail("FORBIDDEN", "You must be an admin to update this workspace", 403);
  
  const okResult = await workspaceService.updateWorkspace(id, ctx.user.id, {
    name,
    description,
    color,
    visibility,
    modes,
    settings,
  });
  if (!okResult) return notFound();
  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  
  const result = await permissionMiddleware.checkWorkspaceRole(id, ctx.user.id, "admin");
  if (result !== "admin") return fail("FORBIDDEN", "You must be an admin to delete this workspace", 403);
  
  const okResult = await workspaceService.deleteWorkspace(id, ctx.user.id);
  if (!okResult) return notFound();
  void auditLogService.record("workspace.delete", "workspace", {
    actorId: ctx.user.id,
    resourceId: id,
  });
  return ok({ ok: true });
});