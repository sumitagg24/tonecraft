import { NextRequest, NextResponse } from "next/server";
import { automationService } from "@/services/AutomationService";
import { guardCronRequest } from "@/lib/cron-guard";
import { logger } from "@/lib/logger";

/**
 * Background worker for scheduled automations.
 *
 * Invoked by a cron scheduler (Vercel Cron via vercel.json, or any HTTP cron
 * service) with `Authorization: Bearer <CRON_SECRET>`. Guarded by the shared
 * cron guard; the public `/api/cron` path in src/proxy.ts lets it run without
 * a user session.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const guarded = guardCronRequest(req);
  if (guarded) return guarded;

  try {
    const started = Date.now();
    const summary = await automationService.runDue();
    logger.info(`[Cron] Automations worker completed in ${Date.now() - started}ms`, summary);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    logger.error("[Cron] Automations worker failed", error);
    return NextResponse.json({ ok: false, error: "Worker failed" }, { status: 500 });
  }
}
