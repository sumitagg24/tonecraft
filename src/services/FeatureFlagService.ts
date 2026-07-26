import {
  type FeatureKey,
  getEnabledFeaturesForPlan,
  isFeatureEnabledForPlan,
} from "@/config/features";
import { planService } from "./PlanService";

export class FeatureFlagService {
  async isEnabled(userId: string, feature: FeatureKey): Promise<boolean> {
    const plan = await planService.getPlan(userId);
    return isFeatureEnabledForPlan(feature, plan.tier);
  }

  async getEnabledFeatures(userId: string): Promise<FeatureKey[]> {
    const plan = await planService.getPlan(userId);
    return getEnabledFeaturesForPlan(plan.tier);
  }
}

export const featureFlagService = new FeatureFlagService();
