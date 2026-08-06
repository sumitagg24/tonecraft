import { ok, withApiHandler } from "@/lib/withApiHandler";
import { versionHistoryService } from "@/services/VersionHistoryService";

const api = withApiHandler();

export const POST = api.POST(async (ctx, body) => {
  const { id } = body as { id: string };
  const result = await versionHistoryService.restore(id);
  if (!result) {
    return { success: false, error: { code: "NOT_FOUND", message: "Snapshot not found" }, status: 404 };
  }
  return ok(result);
});