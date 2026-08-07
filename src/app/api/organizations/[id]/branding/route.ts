import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService } from "@/services/OrganizationService";
import { parseBranding, normalizeHexColor, type OrgBranding } from "@/lib/branding";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const brandingSchema = z.object({
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  customDomain: z.string().min(3).max(160).nullable().optional(),
  supportEmail: z.string().email().nullable().optional(),
});

const api = withApiHandler({ schema: brandingSchema });

export const GET = api.GET(async (ctx) => {
  const branding = await organizationService.getBranding(ctx.params.id, ctx.user.id);
  if (!branding) return notFound();
  return ok(branding);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = brandingSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  // Normalize colors to uppercase hex before persisting.
  const normalized = {
    ...parsed.data,
    primaryColor: normalizeHexColor(parsed.data.primaryColor),
    accentColor: normalizeHexColor(parsed.data.accentColor),
  } as OrgBranding;
  const branding = await organizationService.updateBranding(ctx.params.id, ctx.user.id, normalized);
  if (!branding) return notFound();
  await auditLogService.record("branding.update", "branding", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    metadata: { keys: Object.keys(normalized) },
  });
  return ok(parseBranding(branding));
});
