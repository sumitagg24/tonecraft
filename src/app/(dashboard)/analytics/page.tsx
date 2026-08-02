"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Hash, FileText, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

interface AnalyticsData {
  period: string;
  totalMessages: number;
  totalTokens: number;
  totalFiles: number;
  totalStorage: number;
  avgLatency: number;
  errorRate: number;
  modelUsage: Record<string, number>;
  providerUsage: Record<string, number>;
  subscription: { plan: string; status: string } | null;
  dailyBreakdown: Array<{
    date: string;
    tokens: number;
    latency: number;
    success: boolean;
    model: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await api<AnalyticsData>(`/api/analytics/me?period=${period}`);
        setData(d);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted/10 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your usage and performance overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Messages", value: formatNumber(data.totalMessages), icon: MessageSquare, color: "text-primary" },
            { label: "Tokens", value: formatNumber(data.totalTokens), icon: Hash, color: "text-violet-500" },
            { label: "Files", value: formatNumber(data.totalFiles), icon: FileText, color: "text-emerald-500" },
            { label: "Avg Latency", value: `${data.avgLatency}ms`, icon: Clock, color: "text-amber-500" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/20 bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/20 bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Model Usage</h3>
            <div className="space-y-2">
              {Object.entries(data.modelUsage).map(([model, tokens]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-xs font-medium">{model}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(100, (tokens / Math.max(...Object.values(data.modelUsage))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {formatNumber(tokens)}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(data.modelUsage).length === 0 && (
                <p className="text-xs text-muted-foreground">No data yet</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/20 bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Provider Distribution</h3>
            <div className="space-y-2">
              {Object.entries(data.providerUsage).map(([provider, count]) => (
                <div key={provider} className="flex items-center justify-between">
                  <span className="text-xs font-medium capitalize">{provider}</span>
                  <span className="text-xs text-muted-foreground">{count} calls</span>
                </div>
              ))}
              {Object.keys(data.providerUsage).length === 0 && (
                <p className="text-xs text-muted-foreground">No data yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/20 bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Error Rate</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full"
                style={{ width: `${Math.min(100, data.errorRate)}%` }}
              />
            </div>
            <span className="text-sm font-medium">{data.errorRate}%</span>
          </div>
        </div>

        {data.subscription && (
          <div className="rounded-xl border border-border/20 bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Subscription</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Plan:</span>
              <span className="text-sm font-medium capitalize">{data.subscription.plan}</span>
              <span className="text-xs text-muted-foreground">Status:</span>
              <span className={cn(
                "text-xs font-medium",
                data.subscription.status === "active" ? "text-green-500" : "text-muted-foreground"
              )}>
                {data.subscription.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}