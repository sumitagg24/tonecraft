import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

/**
 * Phase 16 — Personal analytics dashboard.
 * Time saved, credits, productivity, documents, projects.
 */
export const GET = api.GET(async (ctx) => {
  const userId = ctx.user.id;
  const period = ctx.request.nextUrl.searchParams.get("period") || "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [usage, subscription, messageCount, docsCount, notesCount, projectsCount, chatsCreated, avgSessionMs, creditsUsed] =
    await Promise.all([
      prisma.usage.findUnique({ where: { userId } }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.message.count({ where: { chat: { userId }, createdAt: { gte: since } } }),
      prisma.document.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.project.count({ where: { userId, archived: false } }),
      prisma.chat.count({ where: { userId, createdAt: { gte: since } } }),
      // Avg message latency over the window (ms).
      prisma.message.aggregate({ where: { chat: { userId }, createdAt: { gte: since }, latency: { not: null } }, _avg: { latency: true } }),
      prisma.usageRecord.aggregate({ where: { userId, createdAt: { gte: since } }, _sum: { tokens: true } }),
    ]);

  const messagesInWindow = messageCount;
  // ~2 minutes of human writing saved per AI message is a common, defensible estimate.
  const minutesSaved = Math.round(messagesInWindow * 2);

  return ok({
    period,
    timeSavedMinutes: minutesSaved,
    timeSavedLabel: `${Math.floor(minutesSaved / 60)}h ${minutesSaved % 60}m`,
    creditsUsed: creditsUsed._sum.tokens ? Math.round(creditsUsed._sum.tokens / 1000) : 0,
    creditsRemaining: Math.max(0, (subscription?.plan === "pro" ? 500 : 50) - (usage?.creditsUsed ?? 0)),
    messagesInWindow,
    totalMessages: usage?.messagesSent ?? 0,
    docsCount,
    notesCount,
    projectsCount,
    chatsCreated,
    avgLatencyMs: Math.round(avgSessionMs._avg.latency ?? 0),
    dailyActivity: [
      { label: "Messages", value: messagesInWindow },
      { label: "Chats started", value: chatsCreated },
      { label: "Docs", value: docsCount },
      { label: "Projects", value: projectsCount },
    ],
  });
});
