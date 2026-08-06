import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { projectService } from "@/services/ProjectService";
import { projectUpdateSchema } from "@/lib/validators";
import { auditLogService } from "@/services/AuditLogService";

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const { id } = ctx.params;
  const project = await projectService.getProject(id, ctx.user.id);
  if (!project) return notFound();
  const chats = await projectService.listProjectChats(id, ctx.user.id);
  return ok({ project, chats });
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const { id } = ctx.params;
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const okResult = await projectService.updateProject(id, ctx.user.id, parsed.data);
  if (!okResult) return notFound();

  void auditLogService.record("project.update", "project", {
    actorId: ctx.user.id,
    resourceId: id,
    metadata: { changes: parsed.data },
  });

  return ok({ ok: true });
});

export const DELETE = api.DELETE(async (ctx) => {
  const { id } = ctx.params;
  const okResult = await projectService.deleteProject(id, ctx.user.id);
  if (!okResult) return notFound();

  void auditLogService.record("project.delete", "project", {
    actorId: ctx.user.id,
    resourceId: id,
  });

  return ok({ ok: true });
});
