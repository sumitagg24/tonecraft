"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface AiUsageData {
  period: string;
  overview: {
    totalTokens: number;
    totalRequests: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    errorRate: number;
  };
  byModel: Array<{ model: string; tokens: number; calls: number }>;
  byProvider: Array<{ provider: string; calls: number }>;
  dailyUsage: Array<{ date: string; tokens: number; requests: number; errors: number }>;
  recentErrors: Array<{
    id: string;
    provider: string;
    model: string;
    error: string | null;
    tokens: number;
    latency: number;
    createdAt: string;
  }>;
}

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AdminUsagePage() {
  const [data, setData] = useState<AiUsageData | null>(null);
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
      const d = await api<AiUsageData>(`/api/admin/metrics/ai-usage?workspaceId=${workspaceId}&period=${period}`);
      setData(d);
    } catch {
      toast.error("Failed to load AI usage data");
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No AI usage data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Token consumption and model distribution
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-brand" />
              <span className="text-xs text-muted-foreground">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.overview.totalTokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Requests</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.overview.totalRequests)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(data.overview.avgLatency)} ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Error Rate</span>
            </div>
            <p className="text-2xl font-bold">{data.overview.errorRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
            <CardDescription>Token consumption per model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byModel.map((m) => (
                <div key={m.model} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{m.model}</span>
                    <span className="text-muted-foreground">{formatNumber(m.tokens)} tokens · {m.calls} calls</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(m.tokens / Math.max(...data.byModel.map((x) => x.tokens), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.byModel.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
            <CardDescription>Request distribution per provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byProvider.map((p) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{p.provider}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(p.calls / Math.max(...data.byProvider.map((x) => x.calls), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{p.calls}</span>
                  </div>
                </div>
              ))}
              {data.byProvider.length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trend</CardTitle>
          <CardDescription>Requests and tokens over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.dailyUsage.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-xs text-muted-foreground">{d.date}</span>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-brand rounded"
                      style={{
                        width: `${(d.tokens / Math.max(...data.dailyUsage.map((x) => x.tokens), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right text-xs text-muted-foreground">
                  {formatNumber(d.tokens)} tokens
                </span>
                {d.errors > 0 && (
                  <span className="text-xs text-destructive">{d.errors} errors</span>
                )}
              </div>
            ))}
            {data.dailyUsage.length === 0 && (
              <p className="text-sm text-muted-foreground">No data for this period</p>
            )}
          </div>
        </CardContent>
      </Card>

      {data.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>Last {data.recentErrors.length} API errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentErrors.map((e) => (
                <div key={e.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{e.model}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {e.error ?? "Unknown error"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
