import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  department: z.string().max(80).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const api = withApiHandler({ schema: createSchema });

export const GET = api.GET(async (ctx) => {
  const teams = await organizationService.listTeams(ctx.params.id, ctx.user.id);
  if (!teams) return notFound();
  return ok(teams);
});

export const POST = api.POST(async (ctx, body) => {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const team = await organizationService.createTeam(ctx.params.id, ctx.user.id, parsed.data);
  if (!team) return notFound();
  await auditLogService.record("team.create", "team", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    resourceId: team.id,
    metadata: { name: team.name },
  });
  return ok(team, 201);
});
