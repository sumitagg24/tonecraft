import { ok, withApiHandler } from "@/lib/withApiHandler";
import { auditLogService } from "@/services/AuditLogService";
import { requireWorkspaceAdmin } from "@/lib/admin-metrics";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const admin = await requireWorkspaceAdmin(ctx);
  if (!admin.ok) return admin.error;
  const { workspaceId } = admin.scope;

  const sp = ctx.request.nextUrl.searchParams;

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
