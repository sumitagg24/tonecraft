import { ok, withApiHandler } from "@/lib/withApiHandler";
import { promptService } from "@/services/PromptService";

const api = withApiHandler({});

export const GET = api.GET(async (ctx) => {
  const stats = await promptService.getUsageStats(ctx.user.id);
  return ok(stats);
});