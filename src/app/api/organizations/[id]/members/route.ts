import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { organizationService, isDomainAllowedBySso } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const addSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  role: z.enum(["owner", "admin", "manager", "member"]).optional(),
  department: z.string().max(80).optional(),
}).refine((d) => d.email || d.userId, { message: "Provide email or userId" });

const api = withApiHandler({ schema: addSchema });

export const GET = api.GET(async (ctx) => {
  const members = await organizationService.listMembers(ctx.params.id, ctx.user.id);
  if (!members) return notFound();
  return ok(members);
});

export const POST = api.POST(async (ctx, body) => {
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }

  let userId = parsed.data.userId;
  let email = parsed.data.email;
  if (!userId && email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!user) return fail("NOT_FOUND", `No ToneCraft account for ${email}`, 404);
    userId = user.id;
    email = user.email;
  }

  if (!userId) return fail("BAD_REQUEST", "userId required", 400);

  // SSO domain enforcement: if the org enforces SSO, the member's email domain
  // must be in an enabled provider's allowlist.
  const sso = await organizationService.getSsoConfig(ctx.params.id, ctx.user.id);
  if (sso) {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (target?.email && sso.enforced && !isDomainAllowedBySso(sso, target.email)) {
      return fail("SSO_DOMAIN_BLOCKED", `Email domain not allowed by the organization's SSO policy`, 403);
    }
  }

  const member = await organizationService.addMember(ctx.params.id, ctx.user.id, {
    userId,
    role: parsed.data.role,
    department: parsed.data.department,
  });
  if (!member) return notFound();

  await auditLogService.record("organization.member_add", "organization", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    targetId: userId,
    metadata: { role: parsed.data.role ?? "member", email },
  });
  return ok(member, 201);
});
