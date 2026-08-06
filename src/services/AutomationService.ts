import { prisma } from "@/lib/prisma";
import { runAi } from "./ai-assist";
import { notificationService } from "@/services/NotificationService";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { auditLogService } from "@/services/AuditLogService";
import { logger } from "@/lib/logger";

const AUTOMATION_ROLE =
  "You are an automation engine. Execute the user's recurring task precisely, " +
  "returning only the finished output — no preamble, no commentary.";

const BATCH_LIMIT = 25;

export class AutomationService {
  async list(userId: string) {
    return prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(id: string, userId: string) {
    return prisma.automation.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: {
    name: string;
    description?: string;
    trigger?: string;
    cron?: string | null;
    prompt: string;
    enabled?: boolean;
  }) {
    return prisma.automation.create({
      data: {
        userId,
        name: data.name.trim() || "Untitled automation",
        description: data.description ?? null,
        trigger: data.trigger ?? "daily",
        cron: data.cron ?? null,
        prompt: data.prompt,
        enabled: data.enabled ?? true,
        nextRunAt: this.computeNextRun(data.trigger ?? "daily", data.cron ?? undefined),
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string | null;
    trigger?: string;
    cron?: string | null;
    prompt?: string;
    enabled?: boolean;
  }) {
    return prisma.automation.updateMany({ where: { id, userId }, data });
  }

  async remove(id: string, userId: string) {
    return prisma.automation.deleteMany({ where: { id, userId } });
  }

  /** Execute a recurring AI task immediately and schedule the next occurrence. */
  async runNow(id: string, userId: string) {
    const automation = await this.get(id, userId);
    if (!automation) throw new Error("Automation not found");
    return this.executeAutomation(automation);
  }

  /**
   * Background worker entrypoint — consumed by the cron endpoint. Finds enabled
   * automations whose nextRunAt is due, claims each atomically (running flag,
   * safe under concurrent worker instances), executes, and reschedules. Failures
   * are rescheduled (no tight retry loop) and surfaced to the user.
   */
  async runDue(now = new Date()) {
    const due = await prisma.automation.findMany({
      where: { enabled: true, running: false, nextRunAt: { lte: now } },
      orderBy: { nextRunAt: "asc" },
      take: BATCH_LIMIT,
    });

    const results: { id: string; name: string; status: string; nextRunAt?: Date | null }[] = [];

    for (const automation of due) {
      // Respect the user's message/rate limit (same cap as manual runs). The
      // engine additionally enforces credit affordability per call.
      const plan = await planService.getPlan(automation.userId);
      const limit = await checkMessageLimit(automation.userId, plan.tier);
      if (!limit.allowed) {
        const nextRunAt = this.computeNextRun(automation.trigger, automation.cron ?? undefined);
        await prisma.automation.update({ where: { id: automation.id }, data: { nextRunAt } });
        results.push({ id: automation.id, name: automation.name, status: "rate_limited", nextRunAt });
        continue;
      }

      // Atomic claim — exactly one worker wins even if invocations overlap.
      const claimed = await prisma.automation.updateMany({
        where: { id: automation.id, running: false, enabled: true, nextRunAt: { lte: now } },
        data: { running: true },
      });
      if (claimed.count === 0) continue;

      try {
        const { nextRunAt } = await this.executeAutomation(automation);
        results.push({ id: automation.id, name: automation.name, status: "completed", nextRunAt });
        void auditLogService.record("automation.run", "automation", {
          actorId: automation.userId,
          resourceId: automation.id,
          metadata: { name: automation.name },
        });
      } catch (error) {
        // Reschedule to the next occurrence so we don't retry every tick.
        // lastRunAt is intentionally NOT updated — the run failed.
        const nextRunAt = this.computeNextRun(automation.trigger, automation.cron ?? undefined);
        await prisma.automation.update({
          where: { id: automation.id },
          data: { running: false, nextRunAt },
        });
        const message = error instanceof Error ? error.message : "Automation failed";
        logger.error(`[AutomationWorker] ${automation.name} failed`, error);
        void auditLogService.record("automation.run_fail", "automation", {
          actorId: automation.userId,
          resourceId: automation.id,
          metadata: { name: automation.name, error: message.slice(0, 200) },
        });
        await notificationService.create({
          userId: automation.userId,
          type: "system",
          title: `Automation “${automation.name}” failed`,
          body: message.slice(0, 200),
          link: "/automations",
          metadata: { automationId: automation.id, trigger: automation.trigger },
        });
        results.push({ id: automation.id, name: automation.name, status: "failed", nextRunAt });
      }
    }

    return { scanned: due.length, ran: results.length, results };
  }

  /** Run one automation: AI task, reschedule, notify. Clears the running lock. */
  private async executeAutomation(automation: {
    id: string;
    userId: string;
    name: string;
    trigger: string;
    cron: string | null;
    prompt: string;
  }) {
    const { content } = await runAi(automation.prompt, automation.userId, { role: AUTOMATION_ROLE });
    const nextRunAt = this.computeNextRun(automation.trigger, automation.cron ?? undefined);

    await prisma.automation.update({
      where: { id: automation.id },
      data: { lastRunAt: new Date(), nextRunAt, running: false },
    });

    // Notify (10.3): the workflow's final "Notify" step is real — surface the
    // output in the in-app notification center and via realtime channels.
    await notificationService.create({
      userId: automation.userId,
      type: "generation_finished",
      title: `Automation “${automation.name}” ran`,
      body: content.slice(0, 160),
      link: "/automations",
      metadata: { automationId: automation.id, trigger: automation.trigger },
    });

    return { output: content, nextRunAt };
  }

  /**
   * Next-run scheduling. Daily → tomorrow 09:00, weekly → next Monday 09:00,
   * custom → next occurrence of the cron hour:minute, fallback → one hour out.
   */
  private computeNextRun(trigger: string, cron?: string): Date | null {
    const now = new Date();
    if (trigger === "daily") {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    }
    if (trigger === "weekly") {
      const next = new Date(now);
      const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilMonday);
      next.setHours(9, 0, 0, 0);
      return next;
    }
    if (trigger === "custom" && cron) {
      // crude 5-field cron: `minute hour * * *` → next occurrence of hour:minute
      const parts = cron.trim().split(/\s+/);
      const minute = parts[0] === "*" ? 0 : Number(parts[0]);
      const hour = parts[1] === "*" ? 9 : Number(parts[1]);
      const next = new Date(now);
      next.setHours(hour, minute, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return Number.isNaN(next.getTime()) ? null : next;
    }
    // Fallback (custom without cron): one hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
}

export const automationService = new AutomationService();
