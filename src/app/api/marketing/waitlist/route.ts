import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    logger.info("[Waitlist] New signup", { domain: parsed.data.email.split("@")[1] });

    return NextResponse.json({
      success: true,
      message: "You have been added to the ToneCraft waitlist!",
    });
  } catch (error) {
    logger.error("[Waitlist] Signup failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
