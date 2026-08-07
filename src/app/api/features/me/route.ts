import { ok, withApiHandler } from "@/lib/withApiHandler";
import { featureFlagService } from "@/services/FeatureFlagService";

const api = withApiHandler({ rateLimit: { key: "features", limit: 60 } });

/**
 * GET /api/features/me — the runtime-enabled feature keys for the current
 * user (plan defaults merged with DB overrides). The shell uses this to
 * show/hide feature-gated navigation without a deployment.
 */
export const GET = api.GET(async (ctx) => {
  const enabled = await featureFlagService.getEnabledFeatures(ctx.user.id);
  return ok({ features: enabled });
});
