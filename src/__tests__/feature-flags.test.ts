import { describe, it, expect, jest } from "@jest/globals";
import { PlanTier } from "@/config/plans";
import {
  getFeature,
  getFeatureFlags,
  getEnabledFeaturesForPlan,
  isFeatureEnabledForPlan,
  type FeatureKey,
} from "@/config/features";

jest.mock("@/lib/prisma", () => ({
  prisma: { featureOverride: { findMany: jest.fn() } },
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Feature flag registry", () => {
  it("registers the marketplace and memory flags", () => {
    expect(getFeature("marketplace")).toBeDefined();
    expect(getFeature("memory")).toBeDefined();
  });

  it("gives every feature a label and description", () => {
    for (const f of getFeatureFlags()) {
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.description.length).toBeGreaterThan(0);
      expect(f.enabledPlans.length).toBeGreaterThan(0);
    }
  });

  it("defaults marketplace to enterprise-only", () => {
    expect(isFeatureEnabledForPlan("marketplace", PlanTier.FREE)).toBe(false);
    expect(isFeatureEnabledForPlan("marketplace", PlanTier.PRO)).toBe(false);
    expect(isFeatureEnabledForPlan("marketplace", PlanTier.ENTERPRISE)).toBe(true);
  });

  it("defaults memory to all tiers", () => {
    expect(isFeatureEnabledForPlan("memory", PlanTier.FREE)).toBe(true);
    expect(isFeatureEnabledForPlan("memory", PlanTier.PRO)).toBe(true);
    expect(isFeatureEnabledForPlan("memory", PlanTier.ENTERPRISE)).toBe(true);
  });

  it("returns unknown keys as disabled", () => {
    expect(isFeatureEnabledForPlan("does-not-exist" as FeatureKey, PlanTier.ENTERPRISE)).toBe(false);
  });

  it("merges per-plan defaults into a list of keys", () => {
    const enterprise = getEnabledFeaturesForPlan(PlanTier.ENTERPRISE);
    expect(enterprise).toContain("marketplace");
    expect(enterprise).toContain("memory");
  });
});

// --- Nav feature gating contract ---------------------------------------

describe("Nav feature-gating contract", () => {
  it("marks exactly the runtime-toggled destinations with a feature key", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NAV_ITEMS } = require("@/components/shell/nav-items");
    const gated = NAV_ITEMS.filter((i: { feature?: string }) => i.feature);
    const gatedIds = gated.map((i: { id: string }) => i.id).sort();
    expect(gatedIds).toEqual(["marketplace", "memory"]);
  });
});
