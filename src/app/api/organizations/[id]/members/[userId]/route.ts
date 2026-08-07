import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["owner", "admin", "manager", "member"]).optional(),
  department: z.string().max(80).optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const updated = await organizationService.updateMemberRole(
    ctx.params.id,
    ctx.user.id,
    ctx.params.userId,
    parsed.data.role ?? "member",
    parsed.data.department
  );
  if (!updated) return notFound();
  await auditLogService.record("organization.member_role_change", "organization", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    targetId: ctx.params.userId,
    metadata: { role: parsed.data.role, department: parsed.data.department },
  });
  return ok(updated);
});

export const DELETE = api.DELETE(async (ctx) => {
  const removed = await organizationService.removeMember(ctx.params.id, ctx.user.id, ctx.params.userId);
  if (!removed) return notFound();
  await auditLogService.record("organization.member_remove", "organization", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    targetId: ctx.params.userId,
  });
  return ok({ ok: true });
});
