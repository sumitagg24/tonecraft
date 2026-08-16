import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { modelTierLabel } from "@/lib/ai-labels";
import { isGlobalAdmin } from "@/lib/admin";

const api = withApiHandler();

/**
 * Platform-wide analytics (all users, chats, revenue). This is a global admin
 * surface — previously it "authorized" by checking the caller's
 * preferredModel setting, which any user could change themselves (anyone who
 * picked "gpt-4" in their model preferences could read every user's
 * subscription data). Now gated on ADMIN_EMAILS (see src/lib/admin.ts).
 */
export const GET = api.GET(async (ctx) => {
  if (!(await isGlobalAdmin(ctx.user.id))) {
    return fail("FORBIDDEN", "Admin access required", 403);
  }

  const [totalUsers, totalChats, totalMessages, , totalSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
    prisma.usage.findMany(),
    prisma.subscription.findMany(),
  ]);

  const activeSubscriptions = totalSubscriptions.filter((s) => s.status === "active");
  const totalRevenue = activeSubscriptions.length;

  const modelUsage = await prisma.usageRecord.groupBy({
    by: ["model"],
    _sum: { tokens: true },
    _count: { id: true },
  });

  const latencyStats = await prisma.usageRecord.aggregate({
    _avg: { latency: true },
    _min: { latency: true },
    _max: { latency: true },
    where: { success: true },
  });

  const errorRate = await prisma.usageRecord.aggregate({
    _count: { id: true },
    where: { success: false },
  });

  const totalRecords = await prisma.usageRecord.count();
  const errorCount = errorRate._count.id;

  return ok({
    totalUsers,
    totalChats,
    totalMessages,
    totalSubscriptions: totalSubscriptions.length,
    activeSubscriptions: activeSubscriptions.length,
    totalRevenue,
    modelUsage: modelUsage.map((m) => ({
      model: modelTierLabel(m.model),
      tokens: m._sum.tokens ?? 0,
      calls: m._count.id,
    })),
    latency: {
      avg: Math.round(latencyStats._avg.latency ?? 0),
      min: latencyStats._min.latency ?? 0,
      max: latencyStats._max.latency ?? 0,
    },
    errorRate: totalRecords > 0 ? Math.round((errorCount / totalRecords) * 1000) / 10 : 0,
  });
});
