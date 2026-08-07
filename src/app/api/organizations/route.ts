import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens"),
  plan: z.enum(["enterprise", "pro"]).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const orgs = await organizationService.listOrganizationsForUser(ctx.user.id);
  return ok(orgs);
});

export const POST = api.POST(async (ctx, body) => {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const existing = await organizationService.listOrganizationsForUser(ctx.user.id);
  if (existing.length >= 3) {
    return fail("LIMIT_REACHED", "Organization limit reached (3)", 400);
  }
  const org = await organizationService.createOrganization(ctx.user.id, parsed.data);
  await auditLogService.record("organization.create", "organization", {
    actorId: ctx.user.id,
    resourceId: org.id,
    metadata: { name: org.name },
  });
  return ok(org, 201);
});
