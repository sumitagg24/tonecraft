import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { auditLogService } from "@/services/AuditLogService";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const workspaceId = sp.get("workspaceId");

  if (!workspaceId) {
    return fail("BAD_REQUEST", "workspaceId is required", 400);
  }

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const page = Number(sp.get("page") ?? "1");
  const perPage = Math.min(Number(sp.get("perPage") ?? "50"), 100);

  const { items, total } = await auditLogService.list({
    workspaceId,
    actorId: sp.get("actorId") ?? undefined,
    resource: sp.get("resource") ?? undefined,
    action: sp.get("action") ?? undefined,
    page,
    perPage,
  });

  return ok({ items, total });
});
