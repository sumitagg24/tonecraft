import { prisma } from "@/lib/prisma";
import { planService } from "@/services/PlanService";
import { getMonthlyCredits, getDailyCredits, isUnlimited } from "@/config/credits";
import { type PlanTier } from "@/config/plans";
import { logger } from "@/lib/logger";

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  creditsBefore?: number;
  creditsRemaining?: number;
  dailyUsed?: number;
  dailyLimit?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
  resetDate?: Date;
}

export interface UsageRecordInput {
  userId: string;
  modelId: string;
  credits: number;
  operation?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

// ── Owner bypass ─────────────────────────────────────────────────────────────
// OWNER role bypasses ALL credit deductions, daily limits, and quota checks.
// Identified by persisted UserRole in the database, never by email.

async function isOwner(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "OWNER";
}

function isOverride(): boolean {
  return process.env.CREDIT_OVERRIDE === "true";
}

function periodChanged(usagePeriodStart: Date, subPeriodStart: Date): boolean {
  return usagePeriodStart.getTime() !== subPeriodStart.getTime();
}

function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ── Main guard ───────────────────────────────────────────────────────────────

export class UsageGuard {
  /**
   * Returns remaining monthly credits for a user.
   * OWNER / CREDIT_OVERRIDE → Infinity.
   */
  async getRemaining(userId: string): Promise<number> {
    if (isOverride()) return Infinity;
    if (await isOwner(userId)) return Infinity;

    const [plan, usage, sub] = await Promise.all([
      planService.getPlan(userId),
      prisma.usage.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({
        where: { userId },
        select: { currentPeriodStart: true },
      }),
    ]);

    if (isUnlimited(plan.tier)) return Infinity;

    // Auto-reset if subscription period rolled over
    if (usage && sub?.currentPeriodStart && periodChanged(usage.periodStart, sub.currentPeriodStart)) {
      await this.resetPeriod(userId);
      return getMonthlyCredits(plan.tier);
    }

    const allowance = getMonthlyCredits(plan.tier);
    const used = usage?.creditsUsed ?? 0;
    return allowance - used;
  }

  /**
   * Returns remaining daily credits for a user.
   * OWNER / CREDIT_OVERRIDE → Infinity.
   */
  async getDailyRemaining(userId: string): Promise<number> {
    if (isOverride()) return Infinity;
    if (await isOwner(userId)) return Infinity;

    const plan = await planService.getPlan(userId);
    if (isUnlimited(plan.tier)) return Infinity;

    const dailyLimit = getDailyCredits(plan.tier);
    if (dailyLimit === Infinity) return Infinity;

    const usage = await prisma.usage.findUnique({ where: { userId } });
    if (!usage) return dailyLimit;

    // Reset daily counter if stale
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (usage.lastDailyReset.getTime() < dayStart.getTime()) {
      await prisma.usage.update({
        where: { userId },
        data: { dailyMessages: 0, dailyTokens: 0, lastDailyReset: dayStart },
      });
      return dailyLimit;
    }

    return dailyLimit - usage.dailyMessages;
  }

  /**
   * Unified check: verifies both monthly credits AND daily limits.
   * Returns structured result with all context the caller needs.
   */
  async check(userId: string, cost: number): Promise<UsageCheckResult> {
    if (isOverride()) return { allowed: true };
    if (await isOwner(userId)) return { allowed: true };

    const [plan, usage] = await Promise.all([
      planService.getPlan(userId),
      prisma.usage.findUnique({ where: { userId } }),
    ]);

    // Monthly check
    if (isUnlimited(plan.tier)) {
      return { allowed: true };
    }

    const monthlyAllowance = getMonthlyCredits(plan.tier);
    const monthlyUsed = usage?.creditsUsed ?? 0;
    const monthlyRemaining = monthlyAllowance - monthlyUsed;

    if (monthlyRemaining < cost) {
      return {
        allowed: false,
        code: "INSUFFICIENT_CREDITS",
        reason: cost > monthlyRemaining
          ? `This generation requires ${cost} credits, but you have ${Math.max(0, monthlyRemaining)} remaining.`
          : `Insufficient credits. Need ${cost}, ${Math.max(0, monthlyRemaining)} remaining.`,
        creditsBefore: monthlyRemaining,
        creditsRemaining: monthlyRemaining,
        monthlyUsed,
        monthlyLimit: monthlyAllowance,
      };
    }

    // Daily check
    const dailyLimit = getDailyCredits(plan.tier);
    if (dailyLimit !== Infinity) {
      const today = new Date();
      const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dailyUsed = (usage && usage.lastDailyReset.getTime() >= dayStart.getTime())
        ? usage.dailyMessages
        : 0;

      if (dailyUsed >= dailyLimit) {
        return {
          allowed: false,
          code: "DAILY_LIMIT_REACHED",
          reason: `You've used all ${dailyLimit} daily credits. Try again tomorrow or upgrade for higher limits.`,
          dailyUsed,
          dailyLimit,
          creditsRemaining: monthlyRemaining,
        };
      }
    }

    return {
      allowed: true,
      creditsBefore: monthlyRemaining,
      creditsRemaining: monthlyRemaining - cost,
      monthlyUsed,
      monthlyLimit: monthlyAllowance,
      dailyUsed: usage?.dailyMessages ?? 0,
      dailyLimit,
    };
  }

  async canAfford(userId: string, cost: number): Promise<boolean> {
    if (isOverride()) return true;
    if (await isOwner(userId)) return true;
    const result = await this.check(userId, cost);
    return result.allowed;
  }

  /**
   * Atomically record credit consumption. Uses SELECT … FOR UPDATE to prevent
   * double-spending under concurrent requests.
   */
  async record(input: UsageRecordInput): Promise<void> {
    if (isOverride()) return;
    if (input.credits <= 0) return;
    if (await isOwner(input.userId)) {
      // OWNER: log for analytics but don't consume credits
      await this.logEvent(input, "success");
      return;
    }

    const plan = await planService.getPlan(input.userId);
    if (isUnlimited(plan.tier)) {
      await this.logEvent(input, "success");
      return;
    }

    const allowance = getMonthlyCredits(plan.tier);

    try {
      await prisma.$transaction(async (tx) => {
        // Lock the row to prevent concurrent overspend
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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isStaleDay = !existing || existing.lastDailyReset.getTime() < today.getTime();

        await tx.usage.upsert({
          where: { userId: input.userId },
          create: {
            userId: input.userId,
            creditsUsed: input.credits,
            periodStart: sub?.currentPeriodStart ?? now,
            dailyMessages: 1,
            lastDailyReset: today,
          },
          update: {
            creditsUsed: { increment: input.credits },
            periodStart: sub?.currentPeriodStart ?? now,
            dailyMessages: isStaleDay ? 1 : { increment: 1 },
            ...(isStaleDay ? { lastDailyReset: today } : {}),
          },
        });
      });

      // Log event for audit trail (outside transaction — non-critical)
      await this.logEvent(input, "success");
    } catch (error) {
      await this.logEvent(input, "failed");
      throw error;
    }
  }

  private async logEvent(
    input: UsageRecordInput,
    status: string,
  ): Promise<void> {
    try {
      await prisma.usageEvent.create({
        data: {
          userId: input.userId,
          operation: input.operation ?? "unknown",
          model: input.modelId,
          credits: input.credits,
          requestId: input.requestId,
          allowed: status === "allowed" || status === "success",
          reason: status === "allowed" || status === "success" ? null : status,
          metadata: input.metadata as Record<string, string> | undefined,
        },
      });
    } catch (err) {
      // UsageEvent logging is non-critical — never block the request
      logger.warn("Failed to log UsageEvent", { userId: input.userId, error: (err as Error).message });
    }
  }

  async resetPeriod(userId: string): Promise<void> {
    await prisma.usage.upsert({
      where: { userId },
      create: { userId },
      update: { creditsUsed: 0, periodStart: new Date() },
    });
  }
}

export const usageGuard = new UsageGuard();
