import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { permissionMiddleware } from "@/middleware/permissionMiddleware";
import { getFeatureFlags, type FeatureKey } from "@/config/features";
import { featureFlagService } from "@/services/FeatureFlagService";
import { auditLogService } from "@/services/AuditLogService";
import { z } from "zod";

const api = withApiHandler();

const setSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  note: z.string().max(200).optional(),
});

export const GET = api.GET(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return fail("BAD_REQUEST", "workspaceId is required", 400);

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const overrides = await featureFlagService.getAllOverrides();
  const flags = getFeatureFlags().map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description,
    enabledPlans: f.enabledPlans,
    override: overrides[f.key] ?? null,
  }));

  return ok({ flags });
});

export const POST = api.POST(async (ctx, body) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return fail("BAD_REQUEST", "workspaceId is required", 400);

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const parsed = setSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid request body", 400);
  const { key, enabled, note } = parsed.data;

  const feature = getFeatureFlags().find((f) => f.key === key);
  if (!feature) return fail("NOT_FOUND", `Unknown feature: ${key}`, 404);

  await featureFlagService.setOverride(key as FeatureKey, enabled, note, ctx.user.id);
  await auditLogService.record("permission.role_change", "feature_flag", {
    actorId: ctx.user.id,
    workspaceId,
    metadata: { featureKey: key, enabled, note },
  });

  return ok({ key, enabled });
});

export const DELETE = api.DELETE(async (ctx) => {
  const workspaceId = ctx.request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return fail("BAD_REQUEST", "workspaceId is required", 400);

  const role = await permissionMiddleware.checkWorkspaceRole(workspaceId, ctx.user.id, "admin");
  if (role !== "admin") return fail("FORBIDDEN", "Admin access required", 403);

  const key = ctx.request.nextUrl.searchParams.get("key");
  if (!key) return fail("BAD_REQUEST", "key is required", 400);

  await featureFlagService.clearOverride(key as FeatureKey);
  await auditLogService.record("permission.role_change", "feature_flag", {
    actorId: ctx.user.id,
    workspaceId,
    metadata: { featureKey: key, action: "clear" },
  });

  return ok({ cleared: key });
});
