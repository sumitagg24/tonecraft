import {
  type FeatureKey,
  getEnabledFeaturesForPlan,
  isFeatureEnabledForPlan,
} from "@/config/features";
import { planService } from "./PlanService";
import { prisma } from "@/lib/prisma";

/**
 * Phase 12.8 — feature flags.
 *
 * Resolution order (runtime override wins):
 *   1. DB override (FeatureOverride) — set by operators via the admin API,
 *      no deployment required.
 *   2. Plan-based default (config/features.ts).
 *
 * Overrides are cached for a short TTL to keep the hot path off the DB.
 */
const OVERRIDE_CACHE_TTL_MS = 15_000;

export class FeatureFlagService {
  private overrideCache = new Map<string, boolean>();
  private overrideCacheAt = 0;

  async isEnabled(userId: string, feature: FeatureKey): Promise<boolean> {
    const plan = await planService.getPlan(userId);
    const planDefault = isFeatureEnabledForPlan(feature, plan.tier);

    const override = await this.getOverride(feature);
    if (override !== undefined) return override;

    return planDefault;
  }

  async getEnabledFeatures(userId: string): Promise<FeatureKey[]> {
    const plan = await planService.getPlan(userId);
    const defaults = getEnabledFeaturesForPlan(plan.tier);
    const overrides = await this.getAllOverrides();

    const merged = new Set<FeatureKey>(defaults);
    for (const [key, enabled] of Object.entries(overrides)) {
      if (enabled) merged.add(key as FeatureKey);
      else merged.delete(key as FeatureKey);
    }
    return [...merged];
  }

  /** Runtime override, if one exists for the key. */
  async getOverride(feature: FeatureKey): Promise<boolean | undefined> {
    const all = await this.getAllOverrides();
    return all[feature];
  }

  async getAllOverrides(): Promise<Record<string, boolean>> {
    if (Date.now() - this.overrideCacheAt < OVERRIDE_CACHE_TTL_MS) {
      return Object.fromEntries(this.overrideCache);
    }
    try {
      const rows = await prisma.featureOverride.findMany({ select: { key: true, enabled: true } });
      this.overrideCache = new Map(rows.map((r) => [r.key, r.enabled]));
      this.overrideCacheAt = Date.now();
      return Object.fromEntries(this.overrideCache);
    } catch {
      // DB hiccup — fall back to plan defaults (fail-open for flags).
      return {};
    }
  }

  async setOverride(feature: FeatureKey, enabled: boolean, note?: string, updatedBy?: string): Promise<void> {
    await prisma.featureOverride.upsert({
      where: { key: feature },
      create: { key: feature, enabled, note, updatedBy },
      update: { enabled, note, updatedBy },
    });
    this.overrideCache.set(feature, enabled);
    this.overrideCacheAt = Date.now();
  }

  async clearOverride(feature: FeatureKey): Promise<void> {
    await prisma.featureOverride.deleteMany({ where: { key: feature } });
    this.overrideCache.delete(feature);
    this.overrideCacheAt = Date.now();
  }
}

export const featureFlagService = new FeatureFlagService();
