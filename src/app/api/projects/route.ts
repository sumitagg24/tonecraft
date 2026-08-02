import { ok, withApiHandler } from "@/lib/withApiHandler";
import { projectService } from "@/services/ProjectService";
import { projectSchema } from "@/lib/validators";

const api = withApiHandler({ schema: projectSchema });

export const GET = api.GET(async (ctx) => {
  const includeArchived = false;
  const projects = await projectService.listProjects(ctx.user.id, includeArchived);
  const unfiled = await projectService.getUnfiledCount(ctx.user.id);
  return ok({ projects, unfiled });
});

export const POST = api.POST(async (ctx, body) => {
  const project = await projectService.createProject(ctx.user.id, body as typeof projectSchema._output);
  return ok(project, 201);
});
