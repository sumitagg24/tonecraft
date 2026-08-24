import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planService } from "@/services/PlanService";
import { getMonthlyCredits, isUnlimited } from "@/config/credits";

/**
 * GET /api/usage/history — returns usage history with daily aggregations.
 * Used by the /usage page to render charts.
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
  const unlimited = isOwner || isUnlimited(plan.tier);

  // Get current period boundaries
  const now = new Date();
  const periodStart = usage?.periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Fetch all events in the current period
  const events = await prisma.usageEvent.findMany({
    where: {
      userId,
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      operation: true,
      model: true,
      credits: true,
      allowed: true,
      createdAt: true,
    },
  });

  // Daily breakdown — group events by date
  const dailyMap = new Map<string, { credits: number; operations: number; allowed: number; denied: number }>();
  for (const event of events) {
    const dateKey = event.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = dailyMap.get(dateKey) ?? { credits: 0, operations: 0, allowed: 0, denied: 0 };
    existing.credits += event.credits;
    existing.operations += 1;
    if (event.allowed) existing.allowed += 1;
    else existing.denied += 1;
    dailyMap.set(dateKey, existing);
  }

  // Fill in missing days with zeros
  const dailyBreakdown: Array<{
    date: string;
    credits: number;
    operations: number;
    allowed: number;
    denied: number;
  }> = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / dayMs);
  for (let i = 0; i < days; i++) {
    const d = new Date(periodStart.getTime() + i * dayMs);
    const key = d.toISOString().slice(0, 10);
    dailyBreakdown.push({
      date: key,
      ...(dailyMap.get(key) ?? { credits: 0, operations: 0, allowed: 0, denied: 0 }),
    });
  }

  // By operation — aggregate credits and counts per operation type
  const operationMap = new Map<string, { credits: number; count: number }>();
  for (const event of events) {
    const op = event.operation || "unknown";
    const existing = operationMap.get(op) ?? { credits: 0, count: 0 };
    existing.credits += event.credits;
    existing.count += 1;
    operationMap.set(op, existing);
  }

  const byOperation = Array.from(operationMap.entries())
    .map(([operation, data]) => ({ operation, ...data }))
    .sort((a, b) => b.credits - a.credits);

  // Summary stats
  const totalCreditsUsed = events.reduce((sum, e) => sum + e.credits, 0);
  const totalOperations = events.length;
  const allowedOperations = events.filter((e) => e.allowed).length;
  const deniedOperations = events.filter((e) => !e.allowed).length;
  const dailyUsed = usage?.dailyMessages ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        plan: plan.tier,
        role: user?.role ?? "USER",
        credits: {
          allocated: unlimited ? null : monthlyCredits,
          used: totalCreditsUsed,
          remaining: unlimited ? null : Math.max(0, monthlyCredits - totalCreditsUsed),
          unlimited,
        },
        dailyUsed,
        totalOperations,
        allowedOperations,
        deniedOperations,
      },
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      dailyBreakdown,
      byOperation,
      recentEvents: events.slice(0, 50).map((e) => ({
        id: e.id,
        operation: e.operation,
        model: e.model,
        credits: e.credits,
        allowed: e.allowed,
        createdAt: e.createdAt.toISOString(),
      })),
    },
  });
}
