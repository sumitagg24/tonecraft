import { forbidden, ok, withApiHandler } from "@/lib/withApiHandler";
import { activityService } from "@/services/ActivityService";
import { canAccessProject } from "@/lib/resource-access";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().optional(),
});

const api = withApiHandler({ schema });

export const GET = api.GET(async (ctx) => {
  const url = new URL(ctx.request.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  if (projectId && !(await canAccessProject(projectId, ctx.user.id))) return forbidden();

  // Without a project the aggregate is the caller's own activity — a
  // client-supplied userId is ignored so one user can't profile another.
  const filter = { projectId, userId: projectId ? undefined : ctx.user.id };
  const agg = await activityService.aggregate(filter);
  return ok(agg);
});
