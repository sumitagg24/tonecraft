import { fail, ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const snapshot = await versionHistoryService.createSnapshot(body as Parameters<typeof versionHistoryService.createSnapshot>[0]);
  return ok(snapshot, 201);
});

export const GET = api.GET(async (ctx) => {
  const sp = ctx.request.nextUrl.searchParams;
  const resourceType = sp.get("resourceType");
  const resourceId = sp.get("resourceId");
  if (!resourceType || !resourceId) return fail("VALIDATION_ERROR", "resourceType and resourceId are required", 400);
  const page = Number(sp.get("page")) || 1;
  const perPage = Number(sp.get("perPage")) || 20;
  const { items, total } = await versionHistoryService.listVersions(resourceType, resourceId, page, perPage);
  return ok({ items, total });
});