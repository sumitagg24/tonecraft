import { ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";

const api = withApiHandler();

export const GET = api.GET(async (ctx, body) => {
  const { id } = body as { id: string };
  const result = await versionHistoryService.diff(id);
  if (!result) {
    return { success: false, error: { code: "NOT_FOUND", message: "Snapshot not found" }, status: 404 };
  }
  return ok(result);
});