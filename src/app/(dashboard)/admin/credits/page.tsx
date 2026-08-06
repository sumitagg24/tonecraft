"use client";
import { useState, useEffect, useCallback } from "react";
import { CreditCard, TrendingUp, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface CreditsData {
  credits: {
    totalTokens: number;
    totalRequests: number;
    avgLatency: number;
  };
  dailyUsage: Array<{ date: string; tokens: number; requests: number }>;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string | null; image: string | null };
  }>;
  period: string;
}

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function AdminCreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<any[]>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<CreditsData>(`/api/admin/metrics/credits?workspaceId=${workspaceId}&period=${period}`);
      setData(d);
    } catch {
      toast.error("Failed to load credits metrics");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No credits data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits &amp; AI Usage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Credit consumption for your workspace
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.credits.totalTokens)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Total Requests</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.credits.totalRequests)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-cyan-500" />
              <span className="text-xs text-muted-foreground">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(data.credits.avgLatency)} ms</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>Token consumption by day for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.dailyUsage.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-xs text-muted-foreground">{d.date}</span>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded"
                      style={{
                        width: `${(d.tokens / Math.max(...data.dailyUsage.map((x) => x.tokens), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-20 text-right text-xs text-muted-foreground">
                  {formatNumber(d.tokens)} tokens
                </span>
              </div>
            ))}
            {data.dailyUsage.length === 0 && (
              <p className="text-sm text-muted-foreground">No usage data for this period</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Members</CardTitle>
          <CardDescription>{data.members.length} members in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {m.user?.name?.[0] ?? m.user?.email?.[0] ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m.user?.name ?? m.user?.email ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded-full capitalize",
                    m.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : m.role === "manager"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted/20 text-muted-foreground"
                  )}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
