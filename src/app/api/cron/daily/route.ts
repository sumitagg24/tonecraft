import { NextRequest, NextResponse } from "next/server";
import { guardCronRequest } from "@/lib/cron-guard";
import { usageService } from "@/services/UsageService";
import { notificationService } from "@/services/NotificationService";
import { logger } from "@/lib/logger";

/**
 * Daily background worker: idempotent maintenance jobs.
 *  - Reset daily/monthly usage counters (safe to run more than once — only rows
 *    whose window has rolled over are touched).
 *  - Send the daily notification digest to users who enabled it (once per day).
 * Same CRON_SECRET guard and public /api/cron path as the automations worker.
 * Each job is isolated so one failure doesn't skip the others.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const guarded = guardCronRequest(req);
  if (guarded) return guarded;

  const started = Date.now();
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  const jobs: Array<[string, () => Promise<unknown>]> = [
    ["dailyReset", () => usageService.resetDailyIfDue()],
    ["monthlyReset", () => usageService.resetMonthlyIfDue()],
    ["digests", () => notificationService.sendDailyDigests()],
  ];

  for (const [name, run] of jobs) {
    try {
      results[name] = await run();
    } catch (error) {
      errors.push(`${name}: ${error instanceof Error ? error.message : "failed"}`);
      logger.error(`[Cron] Daily job "${name}" failed`, error);
    }
  }

  logger.info(`[Cron] Daily worker completed in ${Date.now() - started}ms`, { results, errors });
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors, ...results }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...results });
}
