import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getMonthlyCredits,
  getDailyCredits,
  isUnlimited,
  getOperationCost,
  intentToOperation,
  calculateCreditCost,
} from "@/config/credits";
import { PlanTier } from "@/config/plans";

// ── Credit config tests ──────────────────────────────────────────────────────

describe("Credit configuration", () => {
  it("FREE plan has 100 monthly and 15 daily credits", () => {
    expect(getMonthlyCredits(PlanTier.FREE)).toBe(100);
    expect(getDailyCredits(PlanTier.FREE)).toBe(15);
  });

  it("PRO plan has 2000 monthly and 200 daily credits", () => {
    expect(getMonthlyCredits(PlanTier.PRO)).toBe(2000);
    expect(getDailyCredits(PlanTier.PRO)).toBe(200);
  });

  it("ENTERPRISE plan has unlimited credits", () => {
    expect(getMonthlyCredits(PlanTier.ENTERPRISE)).toBe(Infinity);
    expect(getDailyCredits(PlanTier.ENTERPRISE)).toBe(Infinity);
    expect(isUnlimited(PlanTier.ENTERPRISE)).toBe(true);
  });

  it("FREE and PRO are not unlimited", () => {
    expect(isUnlimited(PlanTier.FREE)).toBe(false);
    expect(isUnlimited(PlanTier.PRO)).toBe(false);
  });
});

// ── Operation cost tests ─────────────────────────────────────────────────────

describe("Operation costs", () => {
  it("short_rewrite costs 1 credit", () => {
    expect(getOperationCost("short_rewrite")).toBe(1);
  });

  it("tone_adjustment costs 1 credit", () => {
    expect(getOperationCost("tone_adjustment")).toBe(1);
  });

  it("email_generation costs 2 credits", () => {
    expect(getOperationCost("email_generation")).toBe(2);
  });

  it("linkedin_generation costs 2 credits", () => {
    expect(getOperationCost("linkedin_generation")).toBe(2);
  });

  it("twitter_thread costs 3 credits", () => {
    expect(getOperationCost("twitter_thread")).toBe(3);
  });

  it("threads_generation costs 2 credits", () => {
    expect(getOperationCost("threads_generation")).toBe(2);
  });

  it("long_form_generation costs 5 credits", () => {
    expect(getOperationCost("long_form_generation")).toBe(5);
  });

  it("standard_chat costs 2 credits", () => {
    expect(getOperationCost("standard_chat")).toBe(2);
  });

  it("premium_model_request costs 5 credits", () => {
    expect(getOperationCost("premium_model_request")).toBe(5);
  });
});

// ── Intent-to-operation mapping ──────────────────────────────────────────────

describe("intentToOperation", () => {
  it("maps rewrite intent to short_rewrite", () => {
    expect(intentToOperation("rewrite")).toBe("short_rewrite");
  });

  it("maps enhance intent to tone_adjustment", () => {
    expect(intentToOperation("enhance")).toBe("tone_adjustment");
  });

  it("maps summarize intent to summarize", () => {
    expect(intentToOperation("summarize")).toBe("summarize");
  });

  it("maps custom intent to standard_chat", () => {
    expect(intentToOperation("custom")).toBe("standard_chat");
  });

  it("maps unknown intent to standard_chat (fallback)", () => {
    expect(intentToOperation("unknown_intent")).toBe("standard_chat");
  });
});

// ── calculateCreditCost ─────────────────────────────────────────────────────

describe("calculateCreditCost", () => {
  it("uses model cost when available", () => {
    expect(calculateCreditCost(10, "standard_chat")).toBe(10);
  });

  it("falls back to operation cost when model cost is undefined", () => {
    expect(calculateCreditCost(undefined, "standard_chat")).toBe(2);
  });

  it("falls back to operation cost when model cost is 0", () => {
    expect(calculateCreditCost(0, "long_form_generation")).toBe(5);
  });

  it("uses model cost for premium model", () => {
    expect(calculateCreditCost(5, "premium_model_request")).toBe(5);
  });
});
