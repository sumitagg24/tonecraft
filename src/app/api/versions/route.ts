import { ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const snapshot = await versionHistoryService.createSnapshot(body as Parameters<typeof versionHistoryService.createSnapshot>[0]);
  return ok(snapshot, 201);
});

export const GET = api.GET(async (ctx, body) => {
  const { resourceType, resourceId, page, perPage } = body as { resourceType: string; resourceId: string; page?: number; perPage?: number };
  const { items, total } = await versionHistoryService.listVersions(resourceType, resourceId, page, perPage);
  return ok({ items, total });
});