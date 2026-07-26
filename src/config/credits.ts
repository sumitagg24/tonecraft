import { PlanTier } from "./plans";

export interface MonthlyCreditAllowance {
  tier: PlanTier;
  monthlyCredits: number;
  rolloverMax: number;
  trialCredits: number;
}

const TRIAL_CREDITS = 10000;

const CREDIT_ALLOWANCES: readonly MonthlyCreditAllowance[] = [
  { tier: PlanTier.FREE, monthlyCredits: 5000, rolloverMax: 0, trialCredits: TRIAL_CREDITS },
  { tier: PlanTier.PRO, monthlyCredits: 50000, rolloverMax: 100000, trialCredits: TRIAL_CREDITS },
  { tier: PlanTier.ENTERPRISE, monthlyCredits: Infinity, rolloverMax: Infinity, trialCredits: TRIAL_CREDITS },
];

export function getMonthlyCredits(tier: PlanTier): number {
  const allowance = CREDIT_ALLOWANCES.find((c) => c.tier === tier);
  return allowance?.monthlyCredits ?? 0;
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
