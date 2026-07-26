import { planService } from "@/services/PlanService";
import { featureFlagService } from "@/services/FeatureFlagService";
import { usageGuard, type UsageCheckResult } from "@/services/UsageGuard";
import type { FeatureKey } from "@/config/features";
import type { PlanConfig } from "@/config/plans";

export type CapabilityAction = "send-message" | "upload-file";

export interface CapabilityContext {
  userId: string;
  action?: CapabilityAction;
  feature?: FeatureKey;
  cost?: number;
}

export interface CapabilityResult {
  allowed: boolean;
  reason?: string;
  plan: Readonly<PlanConfig>;
  usage?: UsageCheckResult;
}

export class CapabilityRegistry {
  async can(ctx: CapabilityContext): Promise<CapabilityResult> {
    const plan = await planService.getPlan(ctx.userId);

    if (ctx.feature) {
      const enabled = await featureFlagService.isEnabled(
        ctx.userId,
        ctx.feature,
      );
      if (!enabled) {
        return {
          allowed: false,
          reason: `Feature "${ctx.feature}" not available on ${plan.tier} plan`,
          plan,
        };
      }
    }

    if (ctx.cost !== undefined && ctx.cost > 0) {
      const usageResult = await usageGuard.check(ctx.userId, ctx.cost);
      if (!usageResult.allowed) {
        return { allowed: false, plan, usage: usageResult };
      }
    }

    return { allowed: true, plan };
  }

  async require(ctx: CapabilityContext): Promise<Readonly<PlanConfig>> {
    const result = await this.can(ctx);
    return result.plan;
  }
}

export const capabilities = new CapabilityRegistry();
