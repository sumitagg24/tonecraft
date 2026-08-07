import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  plan: z.enum(["enterprise", "pro"]).optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const org = await organizationService.getOrganization(ctx.params.id, ctx.user.id);
  if (!org) return notFound();
  return ok(org);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const org = await organizationService.updateOrganization(ctx.params.id, ctx.user.id, parsed.data);
  if (!org) return notFound();
  await auditLogService.record("organization.update", "organization", {
    actorId: ctx.user.id,
    resourceId: org.id,
    metadata: { changes: parsed.data },
  });
  return ok(org);
});

export const DELETE = api.DELETE(async (ctx) => {
  const deleted = await organizationService.deleteOrganization(ctx.params.id, ctx.user.id);
  if (!deleted) return notFound();
  await auditLogService.record("organization.delete", "organization", {
    actorId: ctx.user.id,
    resourceId: ctx.params.id,
  });
  return ok({ ok: true });
});
