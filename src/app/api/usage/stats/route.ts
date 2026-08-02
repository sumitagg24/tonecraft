import { ok, withApiHandler } from "@/lib/withApiHandler";
import { usageService } from "@/services/UsageService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const stats = await usageService.getStats(ctx.user.id);
  return ok(stats);
});
