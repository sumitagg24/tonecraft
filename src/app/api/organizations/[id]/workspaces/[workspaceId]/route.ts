import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const assignSchema = z.object({
  teamId: z.string().nullable().optional(),
});

const api = withApiHandler({ schema: assignSchema });

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const ws = await organizationService.assignWorkspace(
    ctx.params.id,
    ctx.user.id,
    ctx.params.workspaceId,
    parsed.data.teamId ?? null
  );
  if (!ws) return notFound();
  await auditLogService.record("workspace.org_assign", "workspace", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    resourceId: ws.id,
    metadata: { teamId: parsed.data.teamId ?? null },
  });
  return ok(ws);
});
