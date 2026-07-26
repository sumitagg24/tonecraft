import { prisma } from "@/lib/prisma";
import {
  PlanTier,
  getPlanConfig,
  type PlanConfig,
} from "@/config/plans";

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
    const cached = cache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return getPlanConfig(cached.tier);
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    const tier =
      sub && (sub.status === "active" || sub.status === "trialing")
        ? tierFromString(sub.plan)
        : PlanTier.FREE;

    cache.set(userId, { tier, timestamp: Date.now() });
    return getPlanConfig(tier);
  }

  invalidateCache(userId: string): void {
    cache.delete(userId);
  }
}

export const planService = new PlanService();
