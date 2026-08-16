import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { checkPublicIpLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/request-ip";
import { z } from "zod";

/** Strict email schema — type, length, and format are all enforced. */
const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email address is required")
    .max(254, "Email is too long"),
});

export async function POST(req: NextRequest) {
  // Moderate per-IP ceiling (public endpoint) — env-configurable via
  // RATE_LIMIT_PUBLIC_PER_IP_PER_MIN.
  const ipLimit = await checkPublicIpLimit(getClientIp(req));
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  logger.info("[Waitlist] New signup", { email: parsed.data.email });

  return NextResponse.json({
    success: true,
    message: "You have been added to the ToneCraft waitlist!",
  });
}
