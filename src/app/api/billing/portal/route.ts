import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { billingService } from "@/billing/BillingService";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, subscription: { select: { providerCustomerId: true } } },
  });

  if (!user?.subscription?.providerCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const portal = await billingService.createPortalSession(
    user.subscription.providerCustomerId
  );

  logger.info("Portal session created", { userId: user.id });
  return NextResponse.json({ url: portal.url });
}