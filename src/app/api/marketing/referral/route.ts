import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { referralCode, userId } = body;

    if (!referralCode || !userId) {
      return NextResponse.json({ error: "referralCode and userId required" }, { status: 400 });
    }

    logger.info(`[Referral] User ${userId} used code ${referralCode}`);

    // Award bonus credits or record affiliate attribution
    await prisma.usage.updateMany({
      where: { userId },
      data: { creditsUsed: { decrement: 50 } }, // 50 credit referral bonus
    });

    return NextResponse.json({ success: true, bonusCredits: 50 });
  } catch (error) {
    logger.error("[Referral] Failed to record referral", { error: String(error) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
