import { ok, withApiHandler } from "@/lib/withApiHandler";
import { activityService } from "@/services/ActivityService";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().optional(),
  userId: z.string().optional(),
});

const api = withApiHandler({ schema });

export const GET = api.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const userId = url.searchParams.get("userId") || undefined;
  const filter = { projectId, userId };
  const agg = await activityService.aggregate(filter);
  return ok(agg);
});