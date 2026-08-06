import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Shared guard for background worker endpoints (/api/cron/*). These run without
 * a user session, so auth is the CRON_SECRET bearer token. Returns an error
 * response when the request is invalid, or null to proceed.
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
  return null;
}
