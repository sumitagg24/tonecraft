import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type AnalyticsEvent = string;

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export class AnalyticsService {
  async trackEvent(
    userId: string,
    event: AnalyticsEvent,
    properties?: AnalyticsProperties,
  ): Promise<void> {
    logger.info(`[Analytics] ${event}`, { userId, ...properties });
  }

  /** Personal dashboard metrics: time saved, credits, productivity score, counts. */
  async getPersonalMetrics(userId: string) {
    const [usage, docCount, projectCount, chatCount, taskCount] = await Promise.all([
      prisma.usage.findUnique({ where: { userId } }),
      prisma.document.count({ where: { userId } }),
      prisma.project.count({ where: { userId } }),
      prisma.chat.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: "done" } }),
    ]);

    const messagesSent = usage?.messagesSent ?? 0;
    const tokensUsed = usage?.tokensUsed ?? 0;
    const creditsUsed = usage?.creditsUsed ?? 0;

    // Estimate time saved: 10 mins per message generated + 5 mins per document created
    const minutesSaved = messagesSent * 10 + docCount * 15 + taskCount * 20;
    const hoursSaved = Number((minutesSaved / 60).toFixed(1));

    // Productivity score (0-100 index based on activity depth)
    const productivityScore = Math.min(100, Math.round(messagesSent * 0.5 + docCount * 5 + taskCount * 10 + projectCount * 8));

    return {
      hoursSaved,
      creditsUsed,
      tokensUsed,
      messagesSent,
      docCount,
      projectCount,
      chatCount,
      taskCount,
      productivityScore,
    };
  }

  /** AI Analytics: model distribution, latency, success rate, cost analysis. */
  async getAiMetrics(userId: string) {
    const records = await prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const modelDistribution: Record<string, { count: number; tokens: number; totalLatency: number }> = {};
    let totalSuccess = 0;
    let totalLatency = 0;

    for (const r of records) {
      if (!modelDistribution[r.model]) {
        modelDistribution[r.model] = { count: 0, tokens: 0, totalLatency: 0 };
      }
      modelDistribution[r.model].count += 1;
      modelDistribution[r.model].tokens += r.tokens;
      modelDistribution[r.model].totalLatency += r.latency;

      if (r.success) totalSuccess += 1;
      totalLatency += r.latency;
    }

    const totalRecords = records.length || 1;
    const successRate = Number(((totalSuccess / totalRecords) * 100).toFixed(1));
    const avgLatencyMs = Math.round(totalLatency / totalRecords);

    const models = Object.entries(modelDistribution).map(([model, data]) => ({
      model,
      requests: data.count,
      tokens: data.tokens,
      avgLatencyMs: Math.round(data.totalLatency / (data.count || 1)),
    }));

    return {
      totalRequests: records.length,
      successRate,
      avgLatencyMs,
      models,
    };
  }

  /** Workspace analytics: team activity, tasks, knowledge usage. */
  async getWorkspaceMetrics(workspaceId: string) {
    const [memberCount, projectCount, taskStats, knowledgeCount] = await Promise.all([
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.project.count({ where: { workspaceId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { user: { workspaceMembers: { some: { workspaceId } } } },
        _count: { _all: true },
      }),
      prisma.knowledgeFile.count({ where: { project: { workspaceId } } }),
    ]);

    const tasksByStatus = taskStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    return {
      memberCount,
      projectCount,
      knowledgeCount,
      tasksByStatus,
    };
  }

  /** Admin BI analytics: subscriptions, revenue estimates, retention, heatmaps. */
  async getAdminMetrics() {
    const [totalUsers, subscriptions, usageRecordsCount, totalListings] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.groupBy({
        by: ["plan", "status"],
        _count: { _all: true },
      }),
      prisma.usageRecord.count(),
      prisma.marketplaceListing.count({ where: { status: "published" } }),
    ]);

    const planBreakdown = subscriptions.reduce((acc, curr) => {
      acc[curr.plan] = (acc[curr.plan] || 0) + curr._count._all;
      return acc;
    }, {} as Record<string, number>);

    // Revenue calculation (est: pro $29/mo, enterprise $99/mo)
    const estMonthlyRevenue = (planBreakdown["pro"] || 0) * 29 + (planBreakdown["enterprise"] || 0) * 99;

    return {
      totalUsers,
      totalListings,
      usageRecordsCount,
      planBreakdown,
      estMonthlyRevenue,
    };
  }
}

export const analyticsService = new AnalyticsService();
