import { describe, it, expect } from "@jest/globals";
import {
  getAllModels,
  getAvailableModels,
  getCreditCost,
  getFallbackModels,
  getModelById,
  getModelByProviderModelId,
  getModelsByCapability,
  getModelsByProvider,
  getModelsByTier,
  getSupportedProviders,
  isModelAvailable,
  markModelUnavailable,
} from "@/config/models";
import { getMonthlyCredits, getRolloverMax, getTrialCredits, isUnlimited } from "@/config/credits";
import { ModelRegistry, modelRegistry } from "@/services/ModelRegistry";
import { PlanTier, getPlanConfig } from "@/config/plans";

describe("model catalog", () => {
  it("exposes a non-empty catalog with unique ids", () => {
    const models = getAllModels();
    expect(models.length).toBeGreaterThan(0);
    expect(new Set(models.map((m) => m.id)).size).toBe(models.length);
  });

  it("looks models up by id and by provider model id", () => {
    const first = getAllModels()[0];
    expect(getModelById(first.id)).toBe(first);
    expect(getModelByProviderModelId(first.provider, first.modelId)).toBe(first);
    expect(getModelById("nope")).toBeUndefined();
    expect(getModelByProviderModelId("openai", "nope")).toBeUndefined();
  });

  it("returns available models sorted by descending priority", () => {
    const available = getAvailableModels();
    expect(available.every((m) => m.status === "available")).toBe(true);
    const priorities = available.map((m) => m.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });

  it("filters by provider and capability", () => {
    for (const provider of getSupportedProviders()) {
      expect(getModelsByProvider(provider).every((m) => m.provider === provider)).toBe(true);
    }
    expect(getModelsByCapability("vision").every((m) => m.capabilities.vision)).toBe(true);
    expect(getModelsByCapability("streaming").length).toBeGreaterThan(0);
  });

  it("only lists providers that actually back a model", () => {
    const providers = getSupportedProviders();
    expect(new Set(providers).size).toBe(providers.length);
    expect(providers).toEqual(expect.arrayContaining(["groq"]));
    expect(providers).not.toContain("anthropic");
  });

  it("restricts the free tier to free models but gives pro plans everything", () => {
    expect(getModelsByTier(PlanTier.FREE).every((m) => m.tier === "free")).toBe(true);
    expect(getModelsByTier(PlanTier.PRO).length).toBeGreaterThanOrEqual(getModelsByTier(PlanTier.FREE).length);
    expect(getFallbackModels().every((m) => m.tier === "free")).toBe(true);
  });

  it("reports credit cost per model", () => {
    const first = getAllModels()[0];
    expect(getCreditCost(first.id)).toBe(first.creditCost);
    expect(getCreditCost("nope")).toBeUndefined();
  });

  it("drops a model from the available list once marked unavailable", () => {
    const target = getAvailableModels().at(-1);
    if (!target) throw new Error("expected at least one available model");
    expect(isModelAvailable(target.id)).toBe(true);

    markModelUnavailable(target.id);

    expect(isModelAvailable(target.id)).toBe(false);
    expect(getAvailableModels().map((m) => m.id)).not.toContain(target.id);
    // The catalog itself is unchanged — only availability is tracked separately.
    expect(getModelById(target.id)).toBeDefined();
  });
});

describe("ModelRegistry", () => {
  const registry = new ModelRegistry();
  const freePlan = getPlanConfig(PlanTier.FREE);
  const proPlan = getPlanConfig(PlanTier.PRO);

  it("resolves the models a plan may use", () => {
    expect(registry.resolve(freePlan).every((m) => m.tier === "free")).toBe(true);
  });

  it("narrows the resolution to a single model when asked", () => {
    const target = registry.resolve(freePlan)[0];
    expect(registry.resolve(freePlan, target.id).map((m) => m.id)).toEqual([target.id]);
    expect(registry.resolve(freePlan, "not-a-model")).toEqual([]);
  });

  it("delegates catalog lookups", () => {
    const target = registry.getAllModels()[0];
    expect(registry.getModelById(target.id)).toBe(target);
    expect(registry.getCreditCost(target.id)).toBe(target.creditCost);
    expect(registry.getAvailableModels()).toEqual(getAvailableModels());
    expect(registry.getModelsByProvider(target.provider)).toEqual(getModelsByProvider(target.provider));
    expect(registry.getModelsByCapability("tools")).toEqual(getModelsByCapability("tools"));
    expect(registry.getFallbackModels()).toEqual(getFallbackModels());
  });

  it("builds a fallback chain that excludes the failing model", () => {
    const chain = registry.resolveFallbackChain(proPlan);
    const excluded = chain[0].id;
    const withoutFirst = registry.resolveFallbackChain(proPlan, excluded);
    expect(withoutFirst.map((m) => m.id)).not.toContain(excluded);
    const priorities = withoutFirst.map((m) => m.priority);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });

  it("marks a model decommissioned so it is no longer available", () => {
    const target = registry.getAvailableModels().at(-1);
    if (!target) throw new Error("expected at least one available model");
    registry.markDecommissioned(target.id);
    expect(registry.isAvailable(target.id)).toBe(false);
  });

  it("exports a shared singleton", () => {
    expect(modelRegistry).toBeInstanceOf(ModelRegistry);
  });
});

describe("credit allowances", () => {
  it("grows the monthly allowance with the plan tier", () => {
    expect(getMonthlyCredits(PlanTier.FREE)).toBe(5000);
    expect(getMonthlyCredits(PlanTier.PRO)).toBe(50000);
    expect(getMonthlyCredits(PlanTier.ENTERPRISE)).toBe(Infinity);
    expect(getMonthlyCredits("platinum" as PlanTier)).toBe(0);
  });

  it("only allows rollover above the free tier", () => {
    expect(getRolloverMax(PlanTier.FREE)).toBe(0);
    expect(getRolloverMax(PlanTier.PRO)).toBe(100000);
    expect(getRolloverMax(PlanTier.ENTERPRISE)).toBe(Infinity);
    expect(getRolloverMax("platinum" as PlanTier)).toBe(0);
  });

  it("treats only the enterprise tier as unlimited", () => {
    expect(isUnlimited(PlanTier.FREE)).toBe(false);
    expect(isUnlimited(PlanTier.PRO)).toBe(false);
    expect(isUnlimited(PlanTier.ENTERPRISE)).toBe(true);
  });

  it("grants the same trial credits to everyone", () => {
    expect(getTrialCredits()).toBe(10000);
  });
});
