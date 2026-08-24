import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGlobalAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/usage?userId=xxx — inspect any user's usage (owner/admin only).
 * GET /api/admin/usage — list all users with usage summaries.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const callerId = session.user.id;
  const caller = await prisma.user.findUnique({
    where: { id: callerId },
    select: { role: true, email: true },
  });

  // Only OWNER or ADMIN can access
  if (caller?.role !== "OWNER" && caller?.role !== "ADMIN" && !(await isGlobalAdmin(callerId))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  // Single user inspection
  if (targetUserId) {
    const [user, usage, subscription, events, eventCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.usage.findUnique({ where: { userId: targetUserId } }),
      prisma.subscription.findUnique({
        where: { userId: targetUserId },
        select: { plan: true, status: true, currentPeriodStart: true, currentPeriodEnd: true },
      }),
      prisma.usageEvent.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.usageEvent.count({ where: { userId: targetUserId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        subscription,
        usage: usage ? {
          creditsUsed: usage.creditsUsed,
          periodStart: usage.periodStart,
          dailyMessages: usage.dailyMessages,
          lastDailyReset: usage.lastDailyReset,
        } : null,
        events: events.map((e) => ({
          id: e.id,
          operation: e.operation,
          model: e.model,
          credits: e.credits,
          allowed: e.allowed,
          createdAt: e.createdAt,
          metadata: e.metadata,
        })),
        totalEvents: eventCount,
      },
    });
  }

  // List all users with usage summaries
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      usage: {
        select: {
          creditsUsed: true,
          periodStart: true,
          dailyMessages: true,
        },
      },
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.subscription?.plan ?? "free",
      subscriptionStatus: u.subscription?.status ?? "none",
      creditsUsed: u.usage?.creditsUsed ?? 0,
      dailyMessages: u.usage?.dailyMessages ?? 0,
      periodStart: u.usage?.periodStart ?? null,
    })),
  });
}

/**
 * PATCH /api/admin/usage — adjust credits for a user (owner only).
 * Body: { userId, creditsAdjustment, reason }
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const caller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (caller?.role !== "OWNER") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Owner access required" } },
      { status: 403 },
    );
  }

  const body = await req.json();
  const { userId, creditsAdjustment, reason } = body as {
    userId: string;
    creditsAdjustment: number;
    reason?: string;
  };

  if (!userId || typeof creditsAdjustment !== "number") {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "userId and creditsAdjustment required" } },
      { status: 400 },
    );
  }

  // Adjust credits by modifying the period usage
  await prisma.usage.update({
    where: { userId },
    data: {
      creditsUsed: { increment: -creditsAdjustment },
    },
  });

  // Log the adjustment
  await prisma.usageEvent.create({
    data: {
      userId,
      operation: "admin_credit_adjustment",
      model: "admin",
      credits: creditsAdjustment,
      allowed: true,
      metadata: {
        adjustedBy: session.user.id,
        reason: reason ?? "Admin adjustment",
      },
    },
  });

  logger.info("Admin credit adjustment", {
    targetUserId: userId,
    adjustedBy: session.user.id,
    adjustment: creditsAdjustment,
    reason,
  });

  return NextResponse.json({ success: true });
}
