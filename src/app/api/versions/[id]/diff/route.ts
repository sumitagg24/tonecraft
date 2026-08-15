import { forbidden, notFound, ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";
import { canAccessResource } from "@/lib/resource-access";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const snapshot = await versionHistoryService.getById(ctx.params.id);
  if (!snapshot) return notFound();
  if (!(await canAccessResource(snapshot.resourceType, snapshot.resourceId, ctx.user.id))) {
    return forbidden();
  }

  const result = await versionHistoryService.diff(snapshot.id);
  if (!result) return notFound();
  return ok(result);
});
