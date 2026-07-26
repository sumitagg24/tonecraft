import { prisma } from "@/lib/prisma";
import { planService } from "@/services/PlanService";
import { getMonthlyCredits, isUnlimited } from "@/config/credits";

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface UsageRecordInput {
  userId: string;
  modelId: string;
  credits: number;
}

function isOverride(): boolean {
  return process.env.CREDIT_OVERRIDE === "true";
}

function periodChanged(usagePeriodStart: Date, subPeriodStart: Date): boolean {
  return usagePeriodStart.getTime() !== subPeriodStart.getTime();
}

export class UsageGuard {
  async getRemaining(userId: string): Promise<number> {
    if (isOverride()) return Infinity;

    const [plan, usage, sub] = await Promise.all([
      planService.getPlan(userId),
      prisma.usage.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({
        where: { userId },
        select: { currentPeriodStart: true },
      }),
    ]);

    if (isUnlimited(plan.tier)) return Infinity;

    if (usage && sub?.currentPeriodStart && periodChanged(usage.periodStart, sub.currentPeriodStart)) {
      await this.resetPeriod(userId);
    }

    const allowance = getMonthlyCredits(plan.tier);
    const used = (usage && sub?.currentPeriodStart && periodChanged(usage.periodStart, sub.currentPeriodStart))
      ? 0
      : (usage?.creditsUsed ?? 0);
    return allowance - used;
  }

  async check(userId: string, cost: number): Promise<UsageCheckResult> {
    if (isOverride()) return { allowed: true };

    const remaining = await this.getRemaining(userId);
    if (remaining >= cost) return { allowed: true };

    return {
      allowed: false,
      reason: `Insufficient credits. Need ${cost}, ${Math.max(0, remaining)} remaining.`,
    };
  }

  async canAfford(userId: string, cost: number): Promise<boolean> {
    if (isOverride()) return true;

    const remaining = await this.getRemaining(userId);
    return remaining >= cost;
  }

  async record(input: UsageRecordInput): Promise<void> {
    if (isOverride()) return;
    if (input.credits <= 0) return;

    const plan = await planService.getPlan(input.userId);
    if (isUnlimited(plan.tier)) return;

    const allowance = getMonthlyCredits(plan.tier);

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "creditsUsed" FROM "Usage" WHERE "userId" = ${input.userId} FOR UPDATE`;

      const existing = await tx.usage.findUnique({
        where: { userId: input.userId },
      });

      const sub = await tx.subscription.findUnique({
        where: { userId: input.userId },
        select: { currentPeriodStart: true },
      });

      let currentUsed = existing?.creditsUsed ?? 0;

      if (existing && sub?.currentPeriodStart && periodChanged(existing.periodStart, sub.currentPeriodStart)) {
        currentUsed = 0;
      }

      const newTotal = currentUsed + input.credits;
      if (newTotal > allowance) {
        throw new Error(`Credit limit exceeded: ${newTotal} > ${allowance}`);
      }

      const now = new Date();

      await tx.usage.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          creditsUsed: input.credits,
          periodStart: sub?.currentPeriodStart ?? now,
          periodEnd: undefined,
        },
        update: {
          creditsUsed: { increment: input.credits },
          periodStart: sub?.currentPeriodStart ?? now,
        },
      });
    });
  }

  async resetPeriod(userId: string): Promise<void> {
    await prisma.usage.upsert({
      where: { userId },
      create: { userId },
      update: { creditsUsed: 0, periodStart: new Date() },
    });
  }

  async resetDailyIfStale(userId: string): Promise<void> {
    await this.resetPeriod(userId);
  }
}

export const usageGuard = new UsageGuard();
