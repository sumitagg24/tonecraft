import { ok, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";

const api = withApiHandler();

/**
 * Phase 16 — AI analytics.
 * Most used models, prompt success rate, average cost, average latency.
 */
export const GET = api.GET(async (ctx) => {
  const userId = ctx.user.id;
  const period = ctx.request.nextUrl.searchParams.get("period") || "30d";
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const records = await prisma.usageRecord.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  // Model usage (by call count + tokens).
  const byModel = new Map<string, { calls: number; tokens: number; latency: number[]; errors: number }>();
  for (const r of records) {
    const m = byModel.get(r.model) ?? { calls: 0, tokens: 0, latency: [], errors: 0 };
    m.calls += 1;
    m.tokens += r.tokens ?? 0;
    if (r.latency) m.latency.push(r.latency);
    if (!r.success) m.errors += 1;
    byModel.set(r.model, m);
  }

  const modelUsage = [...byModel.entries()].map(([model, v]) => ({
    model,
    calls: v.calls,
    tokens: v.tokens,
    avgLatency: v.latency.length ? Math.round(v.latency.reduce((a, b) => a + b, 0) / v.latency.length) : 0,
    successRate: v.calls ? Math.round(((v.calls - v.errors) / v.calls) * 100) : 100,
  })).sort((a, b) => b.calls - a.calls);

  const successCount = records.filter((r) => r.success).length;
  const promptSuccessRate = records.length ? Math.round((successCount / records.length) * 100) : 100;
  const totalLatency = records.reduce((a, r) => a + (r.latency ?? 0), 0);
  const avgLatency = records.length ? Math.round(totalLatency / records.length) : 0;
  const totalTokens = records.reduce((a, r) => a + (r.tokens ?? 0), 0);
  // Cost estimate: ~$0.001 per 1K tokens blended across providers (documented estimate).
  const avgCost = records.length ? Number(((totalTokens / 1000) * 0.001 / records.length).toFixed(4)) : 0;
  const totalCost = Number(((totalTokens / 1000) * 0.001).toFixed(2));

  return ok({
    period,
    promptSuccessRate,
    avgLatency,
    avgCost,
    totalCost,
    totalTokens,
    totalCalls: records.length,
    errorCount: records.length - successCount,
    modelUsage,
    dailyTokens: records
      .slice(0, 30)
      .reduce((acc, r) => {
        const d = r.createdAt.toISOString().slice(0, 10);
        acc[d] = (acc[d] ?? 0) + (r.tokens ?? 0);
        return acc;
      }, {} as Record<string, number>),
  });
});
