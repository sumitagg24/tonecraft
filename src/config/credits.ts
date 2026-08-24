import { PlanTier } from "./plans";

// ── Monthly credit allowances ────────────────────────────────────────────────

export interface MonthlyCreditAllowance {
  tier: PlanTier;
  monthlyCredits: number;
  dailyCredits: number;
  rolloverMax: number;
  trialCredits: number;
}

const TRIAL_CREDITS = 500;

const CREDIT_ALLOWANCES: readonly MonthlyCreditAllowance[] = [
  { tier: PlanTier.FREE, monthlyCredits: 100, dailyCredits: 20, rolloverMax: 0, trialCredits: TRIAL_CREDITS },
  { tier: PlanTier.PRO, monthlyCredits: 2000, dailyCredits: 200, rolloverMax: 500, trialCredits: TRIAL_CREDITS },
  { tier: PlanTier.ENTERPRISE, monthlyCredits: Infinity, dailyCredits: Infinity, rolloverMax: Infinity, trialCredits: TRIAL_CREDITS },
];

export function getMonthlyCredits(tier: PlanTier): number {
  const allowance = CREDIT_ALLOWANCES.find((c) => c.tier === tier);
  return allowance?.monthlyCredits ?? 0;
}

export function getDailyCredits(tier: PlanTier): number {
  const allowance = CREDIT_ALLOWANCES.find((c) => c.tier === tier);
  return allowance?.dailyCredits ?? 0;
}

export function getTrialCredits(): number {
  return TRIAL_CREDITS;
}

export function getRolloverMax(tier: PlanTier): number {
  const allowance = CREDIT_ALLOWANCES.find((c) => c.tier === tier);
  return allowance?.rolloverMax ?? 0;
}

export function isUnlimited(tier: PlanTier): boolean {
  return getMonthlyCredits(tier) === Infinity;
}

// ── Tool / intent credit costs ───────────────────────────────────────────────
// Centralized cost table — all AI operations route through here. Costs are
// additive (e.g. a chat response costs baseChatResponse credits).

export type OperationType =
  | "short_rewrite"
  | "tone_adjustment"
  | "email_generation"
  | "linkedin_generation"
  | "twitter_thread"
  | "threads_generation"
  | "long_form_generation"
  | "standard_chat"
  | "premium_model_request"
  | "summarize"
  | "expand"
  | "grammar"
  | "continue"
  | "plan"
  | "research"
  | "meeting_notes"
  | "image_understanding"
  | "voice_transcription";

/** Base credit cost for each operation type. */
const OPERATION_COSTS: Readonly<Record<OperationType, number>> = {
  short_rewrite: 1,
  tone_adjustment: 1,
  email_generation: 2,
  linkedin_generation: 2,
  twitter_thread: 3,
  threads_generation: 2,
  long_form_generation: 5,
  standard_chat: 2,
  premium_model_request: 5,
  summarize: 2,
  expand: 3,
  grammar: 1,
  continue: 2,
  plan: 3,
  research: 5,
  meeting_notes: 3,
  image_understanding: 3,
  voice_transcription: 2,
};

/**
 * Get the base credit cost for an operation type.
 * Model-specific costs (from the model registry) take precedence when available;
 * this serves as the fallback.
 */
export function getOperationCost(operation: OperationType): number {
  return OPERATION_COSTS[operation] ?? 2;
}

/**
 * Map an intent string (from IntentEngine) to an OperationType for credit
 * costing. Unrecognized intents default to standard_chat (2 credits).
 */
export function intentToOperation(intent: string): OperationType {
  const MAP: Record<string, OperationType> = {
    rewrite: "short_rewrite",
    enhance: "tone_adjustment",
    email: "email_generation",
    linkedin: "linkedin_generation",
    twitter: "twitter_thread",
    threads: "threads_generation",
    long_form: "long_form_generation",
    summarize: "summarize",
    expand: "expand",
    grammar: "grammar",
    continue: "continue",
    custom: "standard_chat",
  };
  return MAP[intent] ?? "standard_chat";
}

/**
 * Calculate the effective credit cost for a request.
 * Priority: model registry cost > operation base cost > default (2).
 */
export function calculateCreditCost(
  modelCreditCost: number | undefined,
  operation: OperationType,
): number {
  if (modelCreditCost !== undefined && modelCreditCost > 0) return modelCreditCost;
  return getOperationCost(operation);
}
