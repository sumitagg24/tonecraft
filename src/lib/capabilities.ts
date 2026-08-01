import { planService } from "@/services/PlanService";
import { featureFlagService } from "@/services/FeatureFlagService";
import { usageGuard, type UsageCheckResult } from "@/services/UsageGuard";
import type { FeatureKey } from "@/config/features";
import type { PlanConfig } from "@/config/plans";
import type { Intent, CapabilityTier } from "@/engine/types";
import type { ModelEntry, ModelCapabilities } from "@/config/models";

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

export const CAPABILITY_CHAIN: CapabilityTier[] = [
  "writing",
  "long-context",
  "coding",
  "creative",
  "vision",
];

export const CAPABILITY_REQUIREMENTS: Record<CapabilityTier, Partial<ModelCapabilities>> = {
  writing: {},
  "long-context": { longContext: true },
  coding: { tools: true, reasoning: true },
  creative: { reasoning: true },
  vision: { vision: true },
};

const INTENT_TIER_MAP: Partial<Record<Intent, CapabilityTier>> = {
  summarize: "long-context",
  enhance: "creative",
  custom: "writing",
};

export const CODE_PATTERN = /\b(function|const|let|var|import|export|class|async|await|interface|type\s+\w+\s*=|=>|return\s)/i;

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
    if (!result.allowed) {
      throw new Error(result.reason || "Action not allowed on current plan");
    }
    return result.plan;
  }

  resolveCapabilityTier(
    intent: Intent,
    context?: { hasFiles?: boolean; tokenCount?: number; creativity?: number; isCoding?: boolean },
  ): CapabilityTier {
    if (context?.hasFiles) return "vision";

    if ((context?.tokenCount ?? 0) > 32_000) return "long-context";

    if (context?.isCoding) return "coding";

    if ((context?.creativity ?? 0) > 70) return "creative";

    return INTENT_TIER_MAP[intent] ?? "writing";
  }

  getModelTier(model: ModelEntry): CapabilityTier {
    const caps = model.capabilities;
    if (caps.vision) return "vision";
    if (caps.reasoning && caps.tools) return "creative";
    if (caps.tools) return "coding";
    if (caps.longContext) return "long-context";
    return "writing";
  }

  modelMeetsTier(model: ModelEntry, tier: CapabilityTier): boolean {
    const required = CAPABILITY_REQUIREMENTS[tier];
    if (!required || Object.keys(required).length === 0) return true;
    return (Object.keys(required) as (keyof ModelCapabilities)[]).every(
      (cap) => model.capabilities[cap] === required[cap],
    );
  }

  rankByCapability(models: readonly ModelEntry[], requiredTier: CapabilityTier): ModelEntry[] {
    const requiredIndex = CAPABILITY_CHAIN.indexOf(requiredTier);
    return [...models].sort((a, b) => {
      const aTierIndex = CAPABILITY_CHAIN.indexOf(this.getModelTier(a));
      const bTierIndex = CAPABILITY_CHAIN.indexOf(this.getModelTier(b));
      const aMeets = aTierIndex >= requiredIndex ? 1 : -1;
      const bMeets = bTierIndex >= requiredIndex ? 1 : -1;
      if (aMeets !== bMeets) return bMeets - aMeets;
      if (aTierIndex !== bTierIndex) return bTierIndex - aTierIndex;
      return b.priority - a.priority;
    });
  }
}

export const capabilities = new CapabilityRegistry();
