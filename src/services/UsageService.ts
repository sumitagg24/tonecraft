import { prisma } from "@/lib/prisma";

export class UsageService {
  async trackUsage(userId: string, type: string, amount: number, extra?: {
    provider?: string;
    model?: string;
    latency?: number;
    success?: boolean;
    error?: string;
    workspaceId?: string;
    projectId?: string;
  }) {
    return prisma.usageRecord.create({
      data: {
        userId,
        provider: extra?.provider ?? type,
        model: extra?.model ?? type,
        tokens: amount,
        latency: extra?.latency ?? 0,
        success: extra?.success ?? true,
        error: extra?.error,
        workspaceId: extra?.workspaceId,
        projectId: extra?.projectId,
      },
    });
  }

  async trackWorkspaceUsage(workspaceId: string, userId: string, type: string, amount: number) {
    return this.trackUsage(userId, type, amount, { workspaceId });
  }

  async getWorkspaceUsage(workspaceId: string, filter?: { type?: string; from?: Date; to?: Date }) {
    const where: any = { workspaceId };
    if (filter?.type) where.provider = filter.type;
    if (filter?.from) where.createdAt = { gte: filter.from };
    if (filter?.to) where.createdAt = { ...(where.createdAt ?? {}), lte: filter.to };

    return prisma.usageRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getUserUsage(userId: string, filter?: { type?: string; from?: Date; to?: Date }) {
    const where: any = { userId };
    if (filter?.type) where.provider = filter.type;
    if (filter?.from) where.createdAt = { gte: filter.from };
    if (filter?.to) where.createdAt = { ...(where.createdAt ?? {}), lte: filter.to };

    return prisma.usageRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async aggregateUsage(workspaceId: string, groupBy: "type" | "day" | "month" = "type") {
    const records = await this.getWorkspaceUsage(workspaceId);

    const aggregated: Record<string, number> = {};
    records.forEach((r) => {
      const key =
        groupBy === "type"
          ? r.provider
          : groupBy === "day"
            ? r.createdAt.toISOString().split("T")[0]
            : r.createdAt.toISOString().slice(0, 7);
      aggregated[key] = (aggregated[key] || 0) + r.tokens;
    });

    return Object.entries(aggregated).map(([key, value]) => ({
      [groupBy === "type" ? "type" : groupBy]: key,
      amount: value,
    }));
  }

  async getStats(userId: string) {
    const records = await prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const totalTokens = records.reduce((sum, r) => sum + r.tokens, 0);
    const totalRequests = records.length;

    const byProvider: Record<string, number> = {};
    for (const r of records) {
      byProvider[r.provider] = (byProvider[r.provider] || 0) + r.tokens;
    }

    const daily: Record<string, { requests: number; tokens: number }> = {};
    for (const r of records) {
      const day = r.createdAt.toISOString().split("T")[0];
      daily[day] = daily[day] || { requests: 0, tokens: 0 };
      daily[day].requests += 1;
      daily[day].tokens += r.tokens;
    }

    return {
      totalTokens,
      totalRequests,
      byProvider: Object.entries(byProvider).map(([provider, tokens]) => ({ provider, tokens })),
      daily,
    };
  }
}

export const usageService = new UsageService();
