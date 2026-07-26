import { prisma } from "@/lib/prisma";

export class UsageRepository {
  async getUsage(userId: string) {
    return prisma.usage.findUnique({ where: { userId } }) as unknown as any;
  }

  async getUsageRecords(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.usageRecord.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getProviderBreakdown(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await prisma.usageRecord.groupBy({
      by: ["provider"],
      where: { userId, createdAt: { gte: since } },
      _sum: { tokens: true, latency: true },
      _count: true,
    });
    return records.map(r => ({
      provider: r.provider,
      requests: r._count,
      tokens: r._sum.tokens || 0,
      latency: r._sum.latency || 0,
    }));
  }

  async getModelBreakdown(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await prisma.usageRecord.groupBy({
      by: ["model"],
      where: { userId, createdAt: { gte: since } },
      _sum: { tokens: true, latency: true },
      _count: true,
    });
    return records.map(r => ({
      model: r.model,
      requests: r._count,
      tokens: r._sum.tokens || 0,
      latency: r._sum.latency || 0,
    }));
  }

  async getDailyUsage(userId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const records = await prisma.usageRecord.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, tokens: true, success: true },
    });

    const daily: Record<string, { requests: number; tokens: number; failed: number }> = {};
    for (const r of records) {
      const day = r.createdAt.toISOString().slice(0, 10);
      if (!daily[day]) daily[day] = { requests: 0, tokens: 0, failed: 0 };
      daily[day].requests++;
      daily[day].tokens += r.tokens;
      if (!r.success) daily[day].failed++;
    }
    return Object.entries(daily).map(([date, data]) => ({ date, ...data }));
  }
}

export const usageRepository = new UsageRepository();
