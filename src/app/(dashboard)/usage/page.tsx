"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Infinity,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsageHistory, type UsageHistoryData } from "@/hooks/use-usage-history";

// ── Formatting helpers ──────────────────────────────────────────────

const OP_LABELS: Record<string, string> = {
  chat_stream: "Chat",
  chat_generate: "Chat (generate)",
  tone_rewrite: "Tone rewrite",
  tool_execute: "Tool execution",
  ai_assist: "AI assist",
  regenerate: "Regenerate",
  email_generation: "Email",
  linkedin_generation: "LinkedIn",
  twitter_generation: "Twitter",
  threads_generation: "Threads",
  summarize: "Summarize",
  expand: "Expand",
  shorten: "Shorten",
  plan_generation: "Plan",
  meeting_notes: "Meeting notes",
  research: "Research",
  grammar: "Grammar",
  admin_credit_adjustment: "Admin adjustment",
  unknown: "Other",
};

function opLabel(op: string): string {
  return OP_LABELS[op] ?? op.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CHART_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#ec4899", // pink
  "#3b82f6", // blue
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Summary Card ────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="border-border/40 bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip ──────────────────────────────────────────────────

function DailyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function OperationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3 shadow-lg">
      <p className="text-xs font-medium mb-1">{opLabel(data.operation)}</p>
      <p className="text-sm">{data.credits} credits</p>
      <p className="text-xs text-muted-foreground">{data.count} requests</p>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

export default function UsagePage() {
  const { data, loading, error } = useUsageHistory();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted/40 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-muted/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {error ?? "Failed to load usage data"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, dailyBreakdown, byOperation, recentEvents } = data;
  const { credits } = summary;
  const percentage = credits.allocated
    ? Math.min(100, Math.round((credits.used / credits.allocated) * 100))
    : 0;
  const isOwner = summary.role === "OWNER";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your credit usage for{" "}
              {new Date(data.period.start).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                isOwner
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : summary.plan === "pro"
                    ? "border-violet-500/20 bg-violet-500/10 text-violet-400"
                    : "border-border/40"
              }
            >
              <Zap className="w-3 h-3 mr-1" />
              {isOwner ? "Owner" : summary.plan.charAt(0).toUpperCase() + summary.plan.slice(1)}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing">
                {isOwner ? "Manage" : "Upgrade"}
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isOwner ? (
          <SummaryCard
            title="Credits"
            value="∞ Unlimited"
            subtitle="Owner bypass active"
            icon={Infinity}
            color="bg-emerald-500"
          />
        ) : (
          <SummaryCard
            title="Credits Remaining"
            value={`${credits.remaining ?? 0}`}
            subtitle={`${credits.used} / ${credits.allocated ?? 0} used (${percentage}%)`}
            icon={Zap}
            color={percentage >= 80 ? "bg-amber-500" : "bg-violet-500"}
          />
        )}
        <SummaryCard
          title="Operations"
          value={formatNumber(summary.totalOperations)}
          subtitle={`${summary.allowedOperations} allowed`}
          icon={Activity}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Denied"
          value={formatNumber(summary.deniedOperations)}
          subtitle="Rate limited / over quota"
          icon={AlertTriangle}
          color={summary.deniedOperations > 0 ? "bg-red-500" : "bg-emerald-500"}
        />
        <SummaryCard
          title="Daily Usage"
          value={String(summary.dailyUsed)}
          subtitle="messages today"
          icon={Clock}
          color="bg-cyan-500"
        />
      </motion.div>

      {/* Daily Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Daily Usage</CardTitle>
            <CardDescription>Credits consumed per day this period</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyBreakdown.every((d) => d.credits === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-sm">No usage yet this period</p>
                <p className="text-xs mt-1">Start a chat or use a tool to see your activity</p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DailyTooltip />} />
                    <Bar
                      dataKey="credits"
                      name="Credits"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-column: Operation Breakdown + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operation Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border-border/40 bg-card/50 h-full">
            <CardHeader>
              <CardTitle className="text-base">By Operation</CardTitle>
              <CardDescription>Credit consumption by type</CardDescription>
            </CardHeader>
            <CardContent>
              {byOperation.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">No operations recorded</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byOperation.slice(0, 10)}
                        dataKey="credits"
                        nameKey="operation"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${opLabel(name ?? "")} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {byOperation.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<OperationTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Operation legend list */}
              {byOperation.length > 0 && (
                <div className="mt-4 space-y-2">
                  {byOperation.map((op, i) => (
                    <div key={op.operation} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="flex-1 truncate text-muted-foreground">
                        {opLabel(op.operation)}
                      </span>
                      <span className="font-medium tabular-nums">{op.credits}</span>
                      <span className="text-xs text-muted-foreground/60">
                        ({op.count}×)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-border/40 bg-card/50 h-full">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Last 50 events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      {event.allowed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{opLabel(event.operation)}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {event.model && `${event.model} · `}
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {event.credits} cr
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage period info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="text-center text-xs text-muted-foreground/40 pb-4"
      >
        Period: {formatDate(data.period.start)} — {formatDate(data.period.end)}
        {!isOwner && credits.allocated && (
          <span>
            {" "}· Reset in{" "}
            {Math.max(
              0,
              Math.ceil(
                (new Date(data.period.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              ),
            )}{" "}
            days
          </span>
        )}
      </motion.div>
    </div>
  );
}
