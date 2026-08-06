"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface DailyUsage {
  date: string;
  tokens: number;
  requests: number;
  errors: number;
}

interface ChartData {
  period: string;
  modelUsage: Array<{ model: string; tokens: number; calls: number }>;
  providerUsage: Array<{ provider: string; calls: number }>;
  dailyUsage: DailyUsage[];
  errorRate: number;
  totalRequests: number;
  totalTokens: number;
}

interface AIUsageResponse {
  period: string;
  overview: { totalTokens: number; totalRequests: number; avgLatency: number; errorRate: number };
  byModel: Array<{ model: string; tokens: number; calls: number }>;
  byProvider: Array<{ provider: string; calls: number }>;
  dailyUsage: DailyUsage[];
  errorRate: number;
  recentErrors: unknown[];
}

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const CHART_COLORS = [
  "bg-violet-500", "bg-indigo-500", "bg-blue-500", "bg-cyan-500",
  "bg-teal-500", "bg-green-500", "bg-amber-500", "bg-rose-500",
  "bg-pink-500", "bg-purple-500",
];

export default function AdminChartsPage() {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<Array<{ id: string }>>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<AIUsageResponse>(`/api/admin/metrics/ai-usage?workspaceId=${workspaceId}&period=${period}`);
      setData({
        period: d.period,
        modelUsage: d.byModel,
        providerUsage: d.byProvider,
        dailyUsage: d.dailyUsage,
        errorRate: d.overview.errorRate,
        totalRequests: d.overview.totalRequests,
        totalTokens: d.overview.totalTokens,
      });
    } catch {
      toast.error("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No chart data available.</p>
      </div>
    );
  }

  const maxTokens = Math.max(...data.modelUsage.map((m) => m.tokens), 1);
  const maxDailyTokens = Math.max(...data.dailyUsage.map((d) => d.tokens), 1);
  const maxDailyRequests = Math.max(...data.dailyUsage.map((d) => d.requests), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Charts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual analytics for your workspace
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tokens by Model</CardTitle>
            <CardDescription>Token distribution across AI models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.modelUsage.map((m, i) => (
                <div key={m.model} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <div className={CHART_COLORS[i % CHART_COLORS.length]} />
                    <span className="text-xs truncate">{m.model}</span>
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded"
                      style={{
                        width: `${(m.tokens / maxTokens) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right text-muted-foreground">
                    {formatNumber(m.tokens)}
                  </span>
                </div>
              ))}
              {data.modelUsage.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests by Provider</CardTitle>
            <CardDescription>Request distribution per provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.providerUsage.map((p, i) => (
                <div key={p.provider} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32">
                    <div className={CHART_COLORS[i % CHART_COLORS.length]} />
                    <span className="text-xs capitalize">{p.provider}</span>
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded"
                      style={{
                        width: `${(p.calls / Math.max(...data.providerUsage.map((x) => x.calls), 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right text-muted-foreground">
                    {p.calls}
                  </span>
                </div>
              ))}
              {data.providerUsage.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Token Usage</CardTitle>
            <CardDescription>Token consumption per day (bar chart)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1.5 overflow-x-auto pb-4">
              {data.dailyUsage.map((d) => (
                <div key={d.date} className="flex flex-col items-center flex-1 min-w-[40px]">
                  <div className="w-full h-full flex items-end justify-center">
                    <div
                      className="w-full bg-gradient-to-t from-violet-500 to-indigo-400 rounded-t"
                      style={{
                        height: `${(d.tokens / maxDailyTokens) * 100}%`,
                        minHeight: "2px",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 rotate-[-45deg] origin-left">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
              {data.dailyUsage.length === 0 && (
                <p className="text-sm text-muted-foreground w-full text-center">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Request Volume</CardTitle>
            <CardDescription>Request count per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.dailyUsage.map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-xs text-muted-foreground">{d.date.slice(5)}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded"
                      style={{
                        width: `${(d.requests / maxDailyRequests) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-xs text-right text-muted-foreground">
                    {d.requests}
                  </span>
                  {d.errors > 0 && (
                    <span className="text-xs text-destructive">
                      {d.errors} ✗
                    </span>
                  )}
                </div>
              ))}
              {data.dailyUsage.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Rate Trend</CardTitle>
            <CardDescription>Percentage of failed requests over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-2">
                {data.dailyUsage.map((d) => {
                  const dayErrorRate = d.requests > 0 ? (d.errors / d.requests) * 100 : 0;
                  return (
                    <div key={d.date} className="flex flex-col items-center flex-1 min-w-[40px]">
                      <div className="w-full h-full flex items-end justify-center">
                        <div
                          className={cn(
                            "w-full rounded-t",
                            dayErrorRate > 10 ? "bg-destructive" : dayErrorRate > 0 ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{
                            height: `${dayErrorRate}%`,
                            minHeight: dayErrorRate > 0 ? "2px" : "1px",
                            opacity: dayErrorRate > 0 ? 1 : 0.3,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 rotate-[-45deg] origin-left">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overall metrics for the period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/20 rounded-xl">
                <p className="text-2xl font-bold">{formatNumber(data.totalTokens)}</p>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-xl">
                <p className="text-2xl font-bold">{formatNumber(data.totalRequests)}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-xl">
                <p className="text-2xl font-bold text-destructive">{data.errorRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
              <div className="text-center p-4 bg-muted/20 rounded-xl">
                <p className="text-2xl font-bold">{data.modelUsage.length}</p>
                <p className="text-xs text-muted-foreground">Models Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
