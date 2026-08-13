import { prisma } from "@/lib/prisma";
import {
  PlanTier,
  getPlanConfig,
  type PlanConfig,
} from "@/config/plans";
import { cacheGet, cacheSet, cacheDel } from "@/lib/cache";

const PLAN_CACHE_TTL_SECONDS = 300; // 5 minutes

interface CacheEntry {
  tier: PlanTier;
  timestamp: number;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();

function tierFromString(s: string): PlanTier {
  switch (s) {
    case "pro":
      return PlanTier.PRO;
    case "enterprise":
      return PlanTier.ENTERPRISE;
    default:
      return PlanTier.FREE;
  }
}

export class PlanService {
  async getPlan(userId: string): Promise<Readonly<PlanConfig>> {
    // Phase 12.7 — Redis read-through cache (TTL 5 min) layered on the
    // in-memory cache; invalidated on subscription changes.
    const cached = await cacheGet<PlanTier>(`plan:${userId}`);
    if (cached) return getPlanConfig(cached);

    const mem = cache.get(userId);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
      return getPlanConfig(mem.tier);
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    // Access helper: a subscription grants paid access while `active` or
    // `trialing` — and also while `past_due`, because Paddle keeps retrying
    // payment for a grace period and the customer shouldn't lose features
    // mid-retry. Access is revoked only when the subscription is actually
    // canceled (or explicitly paused). A scheduled_change (cancel/pause at
    // period end) does NOT revoke access.
    const tier =
      sub && isAccessGrantingStatus(sub.status)
        ? tierFromString(sub.plan)
        : PlanTier.FREE;

    cache.set(userId, { tier, timestamp: Date.now() });
    await cacheSet(`plan:${userId}`, tier, PLAN_CACHE_TTL_SECONDS);
    return getPlanConfig(tier);
  }

  async invalidateCache(userId: string): Promise<void> {
    cache.delete(userId);
    await cacheDel(`plan:${userId}`);
  }
}

function isAccessGrantingStatus(status: string | null): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

export const planService = new PlanService();
