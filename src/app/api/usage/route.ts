import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await prisma.usage.findUnique({
    where: { userId: session.user.id },
  });
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const isPro = subscription?.plan === "pro" || subscription?.plan === "enterprise";
  const limits = isPro ? PRO_TIER_LIMITS : FREE_TIER_LIMITS;

  return NextResponse.json({
    usage: usage || {
      messagesSent: 0,
      tokensUsed: 0,
      filesUploaded: 0,
      storageUsed: 0,
    },
    plan: subscription?.plan || "free",
    limits: {
      messagesPerDay: limits.messagesPerDay,
      messagesPerHour: limits.messagesPerHour,
    },
  });
}
