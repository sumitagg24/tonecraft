import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional(),
  department: z.string().max(80).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const team = await organizationService.updateTeam(ctx.params.id, ctx.user.id, ctx.params.teamId, parsed.data);
  if (!team) return notFound();
  await auditLogService.record("team.update", "team", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    resourceId: team.id,
    metadata: { changes: parsed.data },
  });
  return ok(team);
});

export const DELETE = api.DELETE(async (ctx) => {
  const deleted = await organizationService.deleteTeam(ctx.params.id, ctx.user.id, ctx.params.teamId);
  if (!deleted) return notFound();
  await auditLogService.record("team.delete", "team", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    resourceId: ctx.params.teamId,
  });
  return ok({ ok: true });
});
