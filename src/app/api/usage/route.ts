import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planService } from "@/services/PlanService";
import { usageGuard } from "@/services/UsageGuard";
import { getMonthlyCredits, getDailyCredits, isUnlimited } from "@/config/credits";

/**
 * GET /api/usage — returns the current user's usage summary.
 * Used by the frontend to display "63 / 100 credits remaining".
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  const [plan, usage, user] = await Promise.all([
    planService.getPlan(userId),
    prisma.usage.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);

  const isOwner = user?.role === "OWNER";
  const monthlyCredits = getMonthlyCredits(plan.tier);
  const dailyCredits = getDailyCredits(plan.tier);
  const unlimited = isOwner || isUnlimited(plan.tier);

  // Compute daily usage (respect stale reset)
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dailyUsed = usage && usage.lastDailyReset.getTime() >= dayStart.getTime()
    ? usage.dailyMessages
    : 0;

  const monthlyUsed = usage?.creditsUsed ?? 0;
  const monthlyRemaining = unlimited ? Infinity : Math.max(0, monthlyCredits - monthlyUsed);
  const dailyRemaining = unlimited ? Infinity : Math.max(0, dailyCredits - dailyUsed);

  // Compute reset date (end of current month or subscription period)
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { currentPeriodEnd: true },
  });

  const resetDate = sub?.currentPeriodEnd
    ?? new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Recent usage events (last 10)
  const recentEvents = await prisma.usageEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      operation: true,
      model: true,
      credits: true,
      allowed: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      plan: plan.tier,
      role: user?.role ?? "USER",
      credits: {
        monthly: {
          allocated: unlimited ? null : monthlyCredits,
          used: monthlyUsed,
          remaining: unlimited ? null : monthlyRemaining,
          unlimited,
        },
        daily: {
          allocated: unlimited ? null : dailyCredits,
          used: dailyUsed,
          remaining: unlimited ? null : dailyRemaining,
          unlimited,
        },
      },
      resetDate: resetDate.toISOString(),
      recentEvents,
    },
  });
}
