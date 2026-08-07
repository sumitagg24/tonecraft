import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { securityPolicyService, type SecurityPolicyInput } from "@/services/SecurityPolicyService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const updateSchema = z.object({
  minPasswordLength: z.number().int().min(6).max(64).optional(),
  requireUppercase: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireSymbol: z.boolean().optional(),
  enforce2fa: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
  maxDevices: z.number().int().min(1).max(50).optional(),
  passwordExpiryDays: z.number().int().min(30).max(730).nullable().optional(),
  ipAllowlist: z.array(z.string().min(3).max(64)).optional(),
});

const api = withApiHandler({ schema: updateSchema });

export const GET = api.GET(async (ctx) => {
  const policy = await securityPolicyService.getPolicy(ctx.params.id, ctx.user.id);
  if (!policy) return notFound();
  return ok(policy);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const policy = await securityPolicyService.updatePolicy(ctx.params.id, ctx.user.id, parsed.data as SecurityPolicyInput);
  if (!policy) return notFound();
  await auditLogService.record("security.policy_update", "security", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    resourceId: policy.id,
    metadata: { changes: parsed.data },
  });
  return ok(policy);
});
