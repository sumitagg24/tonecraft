import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const getPlan = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const isEnabled = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const usageCheck = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock("@/services/PlanService", () => ({
  planService: { getPlan: (...args: unknown[]) => getPlan(...args) },
}));
jest.mock("@/services/FeatureFlagService", () => ({
  featureFlagService: { isEnabled: (...args: unknown[]) => isEnabled(...args) },
}));
jest.mock("@/services/UsageGuard", () => ({
  usageGuard: { check: (...args: unknown[]) => usageCheck(...args) },
}));

import {
  CapabilityRegistry,
  CAPABILITY_CHAIN,
  CAPABILITY_REQUIREMENTS,
  CODE_PATTERN,
} from "@/lib/capabilities";
import type { ModelCapabilities, ModelEntry } from "@/config/models";

const FREE_PLAN = { tier: "free" } as never;

function model(id: string, caps: Partial<ModelCapabilities>, priority = 1): ModelEntry {
  return {
    id,
    provider: "groq",
    displayName: id,
    modelId: id,
    tier: "free",
    creditCost: 1,
    contextWindow: 8192,
    status: "available",
    priority,
    temperature: 0.7,
    maxTokens: 4096,
    capabilities: {
      streaming: true,
      vision: false,
      tools: false,
      json: false,
      reasoning: false,
      longContext: false,
      ...caps,
    },
  };
}

describe("CODE_PATTERN", () => {
  it("detects code-ish input", () => {
    expect(CODE_PATTERN.test("const x = 1")).toBe(true);
    expect(CODE_PATTERN.test("async function run() {}")).toBe(true);
    expect(CODE_PATTERN.test("import { a } from 'b'")).toBe(true);
    expect(CODE_PATTERN.test("type Foo = { a: string }")).toBe(true);
  });

  it("ignores prose", () => {
    expect(CODE_PATTERN.test("please rewrite this politely")).toBe(false);
    // The arrow alternative is preceded by \b, so it only matches after a word
    // character (`x=> 1`), not after a bare paren.
    expect(CODE_PATTERN.test("() => 1")).toBe(false);
    expect(CODE_PATTERN.test("x=> 1")).toBe(true);
  });
});

describe("CapabilityRegistry.resolveCapabilityTier", () => {
  const registry = new CapabilityRegistry();

  it("prefers vision when files are attached", () => {
    expect(registry.resolveCapabilityTier("rewrite", { hasFiles: true, isCoding: true })).toBe("vision");
  });

  it("prefers long context for very large inputs", () => {
    expect(registry.resolveCapabilityTier("rewrite", { tokenCount: 40_000 })).toBe("long-context");
    expect(registry.resolveCapabilityTier("rewrite", { tokenCount: 1_000 })).toBe("writing");
  });

  it("prefers coding, then creative, over the intent default", () => {
    expect(registry.resolveCapabilityTier("rewrite", { isCoding: true, creativity: 90 })).toBe("coding");
    expect(registry.resolveCapabilityTier("rewrite", { creativity: 90 })).toBe("creative");
    expect(registry.resolveCapabilityTier("rewrite", { creativity: 10 })).toBe("writing");
  });

  it("falls back to the intent mapping", () => {
    expect(registry.resolveCapabilityTier("summarize")).toBe("long-context");
    expect(registry.resolveCapabilityTier("enhance")).toBe("creative");
    expect(registry.resolveCapabilityTier("custom")).toBe("writing");
    expect(registry.resolveCapabilityTier("reply")).toBe("writing");
  });
});

describe("CapabilityRegistry.getModelTier", () => {
  const registry = new CapabilityRegistry();

  it("classifies models by their strongest capability", () => {
    expect(registry.getModelTier(model("a", { vision: true }))).toBe("vision");
    expect(registry.getModelTier(model("b", { reasoning: true, tools: true }))).toBe("creative");
    expect(registry.getModelTier(model("c", { tools: true }))).toBe("coding");
    expect(registry.getModelTier(model("d", { longContext: true }))).toBe("long-context");
    expect(registry.getModelTier(model("e", {}))).toBe("writing");
  });
});

describe("CapabilityRegistry.modelMeetsTier", () => {
  const registry = new CapabilityRegistry();

  it("accepts every model for the writing tier (no requirements)", () => {
    expect(registry.modelMeetsTier(model("a", {}), "writing")).toBe(true);
    expect(CAPABILITY_REQUIREMENTS.writing).toEqual({});
  });

  it("requires every declared capability of the tier", () => {
    expect(registry.modelMeetsTier(model("a", { tools: true }), "coding")).toBe(false);
    expect(registry.modelMeetsTier(model("a", { tools: true, reasoning: true }), "coding")).toBe(true);
    expect(registry.modelMeetsTier(model("a", { longContext: true }), "long-context")).toBe(true);
    expect(registry.modelMeetsTier(model("a", {}), "vision")).toBe(false);
  });
});

describe("CapabilityRegistry.rankByCapability", () => {
  const registry = new CapabilityRegistry();

  it("puts models meeting the required tier first", () => {
    const weak = model("weak", {}, 10);
    const visionCapable = model("vision", { vision: true }, 1);
    const ranked = registry.rankByCapability([weak, visionCapable], "vision");
    expect(ranked.map((m) => m.id)).toEqual(["vision", "weak"]);
  });

  it("breaks ties by provider priority, then capability tier", () => {
    const cheapFast = model("fast", { longContext: true }, 10);
    const heavy = model("heavy", { vision: true }, 5);
    const sameProrityHeavier = model("heavier", { reasoning: true, tools: true }, 10);
    const ranked = registry.rankByCapability([heavy, cheapFast, sameProrityHeavier], "writing");
    expect(ranked.map((m) => m.id)).toEqual(["heavier", "fast", "heavy"]);
  });

  it("does not mutate the input array", () => {
    const models = [model("a", {}, 1), model("b", { vision: true }, 2)];
    registry.rankByCapability(models, "vision");
    expect(models.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("orders the capability chain from weakest to strongest", () => {
    expect(CAPABILITY_CHAIN).toEqual(["writing", "long-context", "coding", "creative", "vision"]);
  });
});

describe("CapabilityRegistry.can / require", () => {
  const registry = new CapabilityRegistry();

  beforeEach(() => {
    jest.clearAllMocks();
    getPlan.mockResolvedValue(FREE_PLAN);
    isEnabled.mockResolvedValue(true);
    usageCheck.mockResolvedValue({ allowed: true });
  });

  it("allows an action with no feature or cost", async () => {
    await expect(registry.can({ userId: "u1" })).resolves.toEqual({ allowed: true, plan: FREE_PLAN });
    expect(isEnabled).not.toHaveBeenCalled();
    expect(usageCheck).not.toHaveBeenCalled();
  });

  it("denies an action gated behind a disabled feature", async () => {
    isEnabled.mockResolvedValue(false);
    const result = await registry.can({ userId: "u1", feature: "team-workspace" });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("team-workspace");
    expect(result.reason).toContain("free");
  });

  it("denies an action when the usage guard rejects it", async () => {
    usageCheck.mockResolvedValue({ allowed: false, remaining: 0 });
    const result = await registry.can({ userId: "u1", cost: 5 });
    expect(result).toEqual({ allowed: false, plan: FREE_PLAN, usage: { allowed: false, remaining: 0 } });
    expect(usageCheck).toHaveBeenCalledWith("u1", 5);
  });

  it("skips the usage guard for zero cost", async () => {
    await registry.can({ userId: "u1", cost: 0 });
    expect(usageCheck).not.toHaveBeenCalled();
  });

  it("require() returns the plan when allowed", async () => {
    await expect(registry.require({ userId: "u1" })).resolves.toBe(FREE_PLAN);
  });

  it("require() throws with the denial reason", async () => {
    isEnabled.mockResolvedValue(false);
    await expect(registry.require({ userId: "u1", feature: "export-pdf" })).rejects.toThrow(/export-pdf/);
  });

  it("require() throws a generic message when no reason is given", async () => {
    usageCheck.mockResolvedValue({ allowed: false });
    await expect(registry.require({ userId: "u1", cost: 1 })).rejects.toThrow(
      "Action not allowed on current plan",
    );
  });
});
