import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    logger.info(`[Waitlist] New signup: ${email}`);

    return NextResponse.json({
      success: true,
      message: "You have been added to the ToneCraft waitlist!",
    });
  } catch (error) {
    logger.error("[Waitlist] Signup failed", { error: String(error) });
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
