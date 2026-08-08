"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Hash,
  FileText,
  Clock,
  BarChart2,
  AlertTriangle,
  Plus,
  Wand2,
  CreditCard,
  RotateCcw,
  Zap,
  Timer,
  Coins,
  Users,
  BookOpen,
  ListChecks,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/suite/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  period: string;
  totalMessages: number;
  totalTokens: number;
  totalFiles: number;
  totalStorage: number;
  avgLatency: number;
  errorRate: number;
  subscription: { plan: string; status: string } | null;
  dailyBreakdown: Array<{
    date: string;
    tokens: number;
    latency: number;
    success: boolean;
  }>;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [personal, setPersonal] = useState<{ timeSavedLabel: string; creditsUsed: number; messagesInWindow: number } | null>(null);
  const [workspace, setWorkspace] = useState<{ members: number; projects: number; messages: number; tasks: number; knowledgeFiles: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, p, w] = await Promise.all([
        api<AnalyticsData>(`/api/analytics/me?period=${period}`),
        api<typeof personal>(`/api/analytics/personal?period=${period}`).catch(() => null),
        api<typeof workspace>(`/api/analytics/workspace?period=${period}`).catch(() => null),
      ]);
      setData(result);
      setPersonal(p);
      setWorkspace(w);
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics metrics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading State (Skeleton Loaders)
  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-[1280px] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-40 bg-muted/40 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="h-9 w-36 bg-muted/30 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-border/30 bg-card/40 p-5 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-muted/30 rounded" />
                  <div className="h-5 w-5 bg-muted/40 rounded-md" />
                </div>
                <div className="h-8 w-24 bg-muted/50 rounded" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl border border-border/30 bg-card/40 p-6 animate-pulse" />
            <div className="h-64 rounded-xl border border-border/30 bg-card/40 p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-[1280px] mx-auto py-16 flex items-center justify-center">
          <Card className="max-w-md w-full text-center p-8 border-destructive/30 bg-card/80 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Load Analytics</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error || "An unexpected error occurred while fetching your workspace metrics."}
            </p>
            <Button onClick={fetchData} variant="outline" className="gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isEmpty = data.totalMessages === 0 && data.totalTokens === 0;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Analytics"
          description="Centralized overview of message volume, tokens, files, latency, and subscription health."
          icon={<BarChart2 className="w-5 h-5 text-white" />}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-surface border border-border/40 p-1 rounded-lg">
                {["7d", "30d", "90d"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-all",
                      period === p
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {/* Quick Actions Widget */}
        <Card className="border-border/40 bg-card/60 shadow-card rounded-xl">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
                <p className="text-xs text-muted-foreground">Jump directly to your most used features</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <Button size="sm" variant="gradient" asChild className="gap-1.5 min-h-[36px]">
                <Link href="/chat">
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5 min-h-[36px]">
                <Link href="/tools">
                  <Wand2 className="w-3.5 h-3.5" />
                  Explore Tools
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5 min-h-[36px]">
                <Link href="/billing">
                  <CreditCard className="w-3.5 h-3.5" />
                  Billing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State vs Metrics Display */}
        {isEmpty ? (
          <Card className="border-border/40 bg-card/50 shadow-card rounded-xl text-center py-16 px-4">
            <CardContent className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-4">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No analytics data yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start using ToneCraft to generate messages and track your usage metrics here.
              </p>
              <Button variant="gradient" asChild size="default">
                <Link href="/chat">
                  <Plus className="w-4 h-4 mr-2" />
                  Start a Conversation
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Metric Cards (4-col grid -> 2-col md -> 1-col) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Messages Sent",
                  value: formatNumber(data.totalMessages),
                  subText: `In last ${period}`,
                  icon: MessageSquare,
                  color: "text-primary",
                  bgColor: "bg-primary/10",
                },
                {
                  label: "Tokens Used",
                  value: formatNumber(data.totalTokens),
                  subText: `Prompt & completion`,
                  icon: Hash,
                  color: "text-violet-400",
                  bgColor: "bg-brand/10",
                },
                {
                  label: "Files Uploaded",
                  value: formatNumber(data.totalFiles),
                  subText: formatFileSize(data.totalStorage),
                  icon: FileText,
                  color: "text-emerald-400",
                  bgColor: "bg-emerald-500/10",
                },
                {
                  label: "Avg Latency",
                  value: `${data.avgLatency} ms`,
                  subText: "Response speed",
                  icon: Clock,
                  color: "text-amber-400",
                  bgColor: "bg-amber-500/10",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="h-full border-border/40 bg-card shadow-card hover:shadow-card-hover transition-all rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                        <stat.icon className={cn("w-4 h-4", stat.color)} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-foreground mb-1">{stat.value}</div>
                    <div className="text-micro text-muted-foreground">{stat.subText}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Error Rate Widget (Full Width) */}
            <Card className="border-border/40 bg-card shadow-card rounded-xl">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Request Error Rate</CardTitle>
                  <Badge variant={data.errorRate > 5 ? "destructive" : "outline"} className="text-xs">
                    {data.errorRate}%
                  </Badge>
                </div>
                <CardDescription className="text-xs">Percentage of failed requests vs overall traffic</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      data.errorRate > 10
                        ? "bg-destructive"
                        : data.errorRate > 2
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.max(data.errorRate, 1)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-micro text-muted-foreground">
                  <span>0% (Optimal)</span>
                  <span>Target: &lt; 1%</span>
                  <span>100% (Critical)</span>
                </div>
              </CardContent>
            </Card>

            {/* Productivity & Team Widgets (Phase 16) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Time saved + credits */}
              <Card className="border-border/40 bg-card shadow-card rounded-xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-semibold">Productivity</CardTitle>
                  <CardDescription className="text-xs">Estimated time saved and credit burn this period</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/30 bg-surface/50 p-4 flex flex-col items-center gap-1.5 text-center">
                    <Timer className="h-4 w-4 text-emerald-400" />
                    <span className="text-xl font-bold tracking-tight">{personal?.timeSavedLabel ?? "—"}</span>
                    <span className="text-micro text-muted-foreground">time saved</span>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-surface/50 p-4 flex flex-col items-center gap-1.5 text-center">
                    <Coins className="h-4 w-4 text-amber-400" />
                    <span className="text-xl font-bold tracking-tight">{(personal?.creditsUsed ?? 0).toLocaleString()}</span>
                    <span className="text-micro text-muted-foreground">credits used</span>
                  </div>
                </CardContent>
              </Card>

              {/* Workspace analytics */}
              <Card className="border-border/40 bg-card shadow-card rounded-xl">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-semibold">Workspace</CardTitle>
                  <CardDescription className="text-xs">Team productivity and asset usage</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 grid grid-cols-3 gap-3">
                  {[
                    { label: "Members", value: workspace?.members ?? 0, icon: Users },
                    { label: "Projects", value: workspace?.projects ?? 0, icon: FileText },
                    { label: "Messages", value: (workspace?.messages ?? 0).toLocaleString(), icon: MessageSquare },
                    { label: "Tasks", value: workspace?.tasks ?? 0, icon: ListChecks },
                    { label: "Knowledge", value: workspace?.knowledgeFiles ?? 0, icon: BookOpen },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border/30 bg-surface/50 p-3 text-center space-y-1">
                      <stat.icon className="h-4 w-4 mx-auto text-primary" />
                      <div className="text-lg font-bold tracking-tight">{stat.value}</div>
                      <div className="text-micro text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Subscription Widget (Full Width) */}
            <Card className="border-border/40 bg-card shadow-card rounded-xl">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-brand-foreground shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Subscription Plan: <span className="capitalize">{data.subscription?.plan || "Free"}</span>
                      </h3>
                      <Badge
                        variant={data.subscription?.status === "active" ? "default" : "secondary"}
                        className="text-micro capitalize"
                      >
                        {data.subscription?.status || "Active"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.subscription?.plan === "pro"
                        ? "Unlimited messages and 16K context window active."
                        : "50 messages per day free limit active."}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild className="min-h-[36px]">
                  <Link href="/billing">Manage Subscription</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer Timestamp */}
        {lastUpdated && (
          <div className="text-center pt-2">
            <span className="text-micro text-muted-foreground/60">Last updated: {lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
}