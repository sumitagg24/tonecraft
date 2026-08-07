import { ok, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const page = Number(ctx.request.nextUrl.searchParams.get("page") ?? "1");
  const perPage = Math.min(Number(ctx.request.nextUrl.searchParams.get("perPage") ?? "50"), 100);
  const action = ctx.request.nextUrl.searchParams.get("action") ?? undefined;
  const result = await organizationService.listAuditLogs(ctx.params.id, ctx.user.id, { page, perPage, action });
  if (!result) return notFound();
  return ok(result);
});
