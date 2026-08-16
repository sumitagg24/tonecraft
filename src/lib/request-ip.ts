import type { NextRequest } from "next/server";

/**
 * Best-effort client IP (x-forwarded-for from the proxy).
 * Single source of truth — previously duplicated in withApiHandler, proxy.ts,
 * and the waitlist route.
 */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
