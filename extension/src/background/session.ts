/**
 * ToneCraft extension — session state (service worker).
 *
 * The extension never mints credentials: it probes the existing backend with
 * the user's own Clerk session. Signed-in status, plan and usage come
 * straight from `/api/subscription` + `/api/usage`, so the popup always shows
 * the same account state as the website. Results are cached in memory for 60s
 * to avoid hammering the API from popup opens.
 */
import { apiClient } from "./apiClient";
import type { SubscriptionState } from "../shared/types";

interface SubscriptionPayload {
  plan: string;
  label: string;
  status: string;
}

interface UsagePayload {
  plan: string;
  credits: {
    monthly: { allocated: number | null; used: number; remaining: number | null; unlimited: boolean };
    daily: { allocated: number | null; used: number; remaining: number | null; unlimited: boolean };
  };
}

let cached: { at: number; state: SubscriptionState } | null = null;
const CACHE_MS = 60_000;

export function invalidateSessionCache(): void {
  cached = null;
}

export async function getSessionState(force = false): Promise<SubscriptionState> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.state;
  const state = await fetchSessionState();
  cached = { at: Date.now(), state };
  return state;
}

async function fetchSessionState(): Promise<SubscriptionState> {
  let sub: SubscriptionPayload;
  try {
    sub = await apiClient.get<SubscriptionPayload>("/api/subscription");
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === "UNAUTHORIZED") {
      return signedOut();
    }
    throw err;
  }

  let usage: UsagePayload | null = null;
  try {
    usage = await apiClient.get<UsagePayload>("/api/usage");
  } catch {
    usage = null; // plan display still works without usage numbers
  }

  const unlimited = usage?.credits.daily.unlimited ?? false;
  return {
    signedIn: true,
    plan: sub.plan,
    planLabel: sub.label || sub.plan,
    dailyRemaining: usage?.credits.daily.remaining ?? null,
    dailyAllocated: usage?.credits.daily.allocated ?? null,
    monthlyRemaining: usage?.credits.monthly.remaining ?? null,
    monthlyAllocated: usage?.credits.monthly.allocated ?? null,
    unlimited,
  };
}

function signedOut(): SubscriptionState {
  return {
    signedIn: false,
    plan: "free",
    planLabel: "Signed out",
    dailyRemaining: null,
    dailyAllocated: null,
    monthlyRemaining: null,
    monthlyAllocated: null,
    unlimited: false,
  };
}
