import { ok, withApiHandler } from "@/lib/withApiHandler";
import { optimizeCollaborationStorage } from "@/lib/socket-storage";

const api = withApiHandler();

export const POST = api.POST(async () => {
  const result = await optimizeCollaborationStorage();
  return ok(result);
});