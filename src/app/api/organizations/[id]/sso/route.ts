import { ok, fail, notFound, withApiHandler } from "@/lib/withApiHandler";
import { organizationService, parseSsoConfig, type SsoConfig } from "@/services/OrganizationService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const providerSchema = z.object({
  provider: z.enum(["google_workspace", "azure_ad", "okta"]),
  enabled: z.boolean(),
  domains: z.array(z.string().min(2).max(80)),
});

const ssoSchema = z.object({
  enforced: z.boolean(),
  providers: z.array(providerSchema),
  samlMetadataUrl: z.string().url().nullable().optional(),
});

const api = withApiHandler({ schema: ssoSchema });

export const GET = api.GET(async (ctx) => {
  const config = await organizationService.getSsoConfig(ctx.params.id, ctx.user.id);
  if (!config) return notFound();
  return ok(config);
});

export const PATCH = api.PATCH(async (ctx, body) => {
  const parsed = ssoSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  const config = await organizationService.updateSsoConfig(ctx.params.id, ctx.user.id, parsed.data as SsoConfig);
  if (!config) return notFound();
  await auditLogService.record("sso.config_update", "sso", {
    actorId: ctx.user.id,
    organizationId: ctx.params.id,
    metadata: { enforced: parsed.data.enforced, providers: parsed.data.providers.map((p) => p.provider) },
  });
  return ok(parseSsoConfig(config));
});
