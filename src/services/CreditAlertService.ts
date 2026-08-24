import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { notificationService } from "@/services/NotificationService";
import { planService } from "@/services/PlanService";
import { getMonthlyCredits, isUnlimited } from "@/config/credits";

/**
 * CreditAlertService — sends email + in-app notifications when a user's
 * credit usage crosses the 20% remaining threshold.
 *
 * Cooldown: we check for recent `credit_alert` UsageEvents in the current
 * period. If one exists at the same or higher threshold level, we skip.
 *
 * Thresholds:
 *   - 80% used (20% remaining) → first warning
 *   - 95% used (5% remaining)  → urgent warning
 *   - 100% used (0% remaining) → exhausted
 */

const THRESHOLDS = [
  { usedPercent: 80, level: 1, label: "low", message: "You've used 80% of your monthly credits." },
  { usedPercent: 95, level: 2, label: "critical", message: "You've used 95% of your monthly credits. Upgrade to continue." },
  { usedPercent: 100, level: 3, label: "exhausted", message: "You've used all your monthly credits. Upgrade to Pro to continue generating." },
] as const;

class CreditAlertService {
  /**
   * Check credit usage after a successful recording and send alerts
   * if thresholds were crossed. Non-blocking — errors are logged and swallowed.
   */
  async checkAndAlert(userId: string): Promise<void> {
    try {
      const [plan, usage, user] = await Promise.all([
        planService.getPlan(userId),
        prisma.usage.findUnique({ where: { userId } }),
        prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      ]);

      // Skip: owner, unlimited plans, no usage record yet
      if (user?.role === "OWNER") return;
      if (isUnlimited(plan.tier)) return;
      if (!usage) return;

      const allowance = getMonthlyCredits(plan.tier);
      if (allowance <= 0) return;

      const usedPercent = Math.round((usage.creditsUsed / allowance) * 100);

      // Find the highest threshold crossed
      const crossed = [...THRESHOLDS]
        .reverse()
        .find((t) => usedPercent >= t.usedPercent);
      if (!crossed) return;

      // Cooldown: check if we already sent an alert at this level or higher in this period
      const recentAlert = await prisma.usageEvent.findFirst({
        where: {
          userId,
          operation: "credit_alert",
          createdAt: { gte: usage.periodStart },
        },
        orderBy: { createdAt: "desc" },
        select: { metadata: true },
      });

      if (recentAlert?.metadata) {
        const meta = recentAlert.metadata as Record<string, unknown>;
        const lastLevel = (meta.level as number) ?? 0;
        if (lastLevel >= crossed.level) return;
      }

      // Send the alert via NotificationService (handles in-app + email + push)
      const subject =
        crossed.usedPercent === 100
          ? "Credits exhausted — upgrade to continue"
          : crossed.usedPercent === 95
            ? "Credits almost gone"
            : "Credits running low";

      const body = `${crossed.message} You've used ${usage.creditsUsed} of ${allowance} credits this month.`;

      await notificationService.create({
        userId,
        type: "credits_low",
        title: subject,
        body,
        link: "/usage",
        metadata: {
          usedPercent,
          creditsUsed: usage.creditsUsed,
          allowance,
          threshold: crossed.label,
          level: crossed.level,
        },
      });

      // Log the alert as a UsageEvent for cooldown tracking
      await prisma.usageEvent.create({
        data: {
          userId,
          operation: "credit_alert",
          credits: 0,
          allowed: true,
          reason: crossed.label,
          metadata: {
            level: crossed.level,
            usedPercent,
            creditsUsed: usage.creditsUsed,
            allowance,
          },
        },
      });

      logger.info("[CreditAlert] Alert sent", {
        userId,
        threshold: crossed.label,
        usedPercent,
        creditsUsed: usage.creditsUsed,
        allowance,
      });
    } catch (err) {
      // Credit alerts are non-critical — never block the request
      logger.warn("[CreditAlert] Failed to check/send alert", {
        userId,
        error: (err as Error).message,
      });
    }
  }
}

export const creditAlertService = new CreditAlertService();
