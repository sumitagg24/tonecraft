import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capabilities } from "@/lib/capabilities";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await prisma.usage.findUnique({
    where: { userId: session.user.id },
  });
  const plan = await capabilities.require({ userId: session.user.id });

  return NextResponse.json({
    usage: usage || {
      messagesSent: 0,
      tokensUsed: 0,
      filesUploaded: 0,
      storageUsed: 0,
    },
    plan: plan.tier,
    limits: {
      messagesPerDay: plan.limits.messagesPerDay,
      messagesPerHour: plan.limits.messagesPerHour,
    },
  });
}
