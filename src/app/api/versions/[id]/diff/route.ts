import { ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const result = await versionHistoryService.diff(ctx.params.id);
  if (!result) {
    return { success: false, error: { code: "NOT_FOUND", message: "Snapshot not found" }, status: 404 };
  }
  return ok(result);
});