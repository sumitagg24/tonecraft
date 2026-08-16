import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** A valid 5-field cron expression (Vercel format, UTC). */
const CRON_EXPRESSION = /^(\*|[0-5]?\d)(\/(\d{1,2}))?\s(\*|[01]?\d|2[0-3])(\/(\d{1,2}))?\s(\*|[0-2]?\d|3[01])(\/(\d{1,2}))?\s(\*|[1-9]|1[0-2])(\/(\d{1,2}))?\s(\*|[0-6])(\/(\d{1,2}))?$/;

/**
 * Shared guard for background worker endpoints (/api/cron/*). These run without
 * a user session, so auth is the CRON_SECRET bearer token — Vercel sends it
 * automatically as `Authorization: Bearer <CRON_SECRET>` when the project has a
 * CRON_SECRET env var (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
 *
 * Defense in depth, on top of the bearer check:
 *  - When a request carries Vercel's `x-vercel-cron-schedule` header (i.e. it
 *    claims to be a Vercel cron), it must be a valid cron expression and the
 *    user agent must start with `vercel-cron/` — rejects header spoofing.
 *  - Requests WITHOUT the schedule header (manual/local invocations that
 *    present a valid bearer secret) are still accepted and logged, so
 *    operators can trigger workers by hand without breaking the pattern.
 *
 * Returns an error response when the request is invalid, or null to proceed.
 */
export function guardCronRequest(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("[Cron] CRON_SECRET is not configured");
    return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  if (!safeEqual(authHeader, `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const schedule = req.headers.get("x-vercel-cron-schedule");
  if (schedule !== null) {
    const userAgent = req.headers.get("user-agent") ?? "";
    if (!userAgent.startsWith("vercel-cron/") || !CRON_EXPRESSION.test(schedule)) {
      logger.warn("[Cron] Rejected request spoofing Vercel cron headers");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else {
    logger.info("[Cron] Manual invocation (no x-vercel-cron-schedule header)");
  }

  return null;
}
