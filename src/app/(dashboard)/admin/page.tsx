"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminPageSkeleton } from "@/components/shared/AdminPageSkeleton";
import {
  useAdminMetrics,
  METRIC_PERIODS,
  DEFAULT_METRIC_PERIOD,
} from "@/hooks/use-admin-metrics";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, Folder, MessageSquare, HardDrive, Activity,
  BarChart3, TrendingUp, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCompactNumber, formatFileSize } from "@/lib/utils";

interface OverviewData {
  workspace: { id: string; name: string; color: string };
  members: { total: number };
  projects: { total: number };
  chats: { total: number };
  messages: { total: number };
  knowledge: { files: number; storageBytes: number };
  aiUsage: { tokens: number; requests: number };
  billing: { activeSubscriptions: number };
  period: string;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<string>(DEFAULT_METRIC_PERIOD);
  // Hydration-safe "last updated" — rendered only after mount, deterministic locale.
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString("en-US"));
  }, []);

  const { data, loading } = useAdminMetrics<OverviewData>({
    path: useCallback(
      (workspaceId: string) =>
        `/api/admin/metrics/overview?workspaceId=${workspaceId}&period=${period}`,
      [period]
    ),
    errorMessage: "Failed to load workspace overview",
  });

  if (loading) {
    return <AdminPageSkeleton count={8} gridClassName="grid-cols-2 md:grid-cols-4" />;
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Failed to load overview data.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Members", value: data.members.total.toString(), icon: Users, color: "text-blue-500" },
    { label: "Projects", value: data.projects.total.toString(), icon: Folder, color: "text-brand" },
    { label: "Chats", value: data.chats.total.toString(), icon: MessageSquare, color: "text-emerald-500" },
    { label: "Messages", value: formatCompactNumber(data.messages.total), icon: Activity, color: "text-amber-500" },
    { label: "Knowledge Files", value: data.knowledge.files.toString(), icon: HardDrive, color: "text-cyan-500" },
    { label: "Storage", value: formatFileSize(data.knowledge.storageBytes), icon: HardDrive, color: "text-indigo-500" },
    { label: "AI Tokens", value: formatCompactNumber(data.aiUsage.tokens), icon: BarChart3, color: "text-pink-500" },
    { label: "AI Requests", value: formatCompactNumber(data.aiUsage.requests), icon: TrendingUp, color: "text-rose-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspace Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.workspace.name} — Overview of workspace metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {METRIC_PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("w-4 h-4", stat.color)} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Paid workspaces in this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.billing.activeSubscriptions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" size="sm" onClick={() => router.push("/admin/members")}>
              Manage Members
            </Button>
            <Button className="w-full justify-start" variant="outline" size="sm" onClick={() => router.push("/admin/permissions")}>
              Permission Settings
            </Button>
            <Button className="w-full justify-start" variant="outline" size="sm" onClick={() => router.push("/admin/audit")}>
              View Audit Log
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Current workspace details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: data.workspace.color }}
              />
              <span className="font-medium">{data.workspace.name}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              ID: {data.workspace.id.slice(0, 8)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {data.aiUsage.requests > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent AI Activity</CardTitle>
            <CardDescription>Last {period} period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Tokens</span>
                  <span className="font-medium">{formatCompactNumber(data.aiUsage.tokens)}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Requests</span>
                  <span className="font-medium">{formatCompactNumber(data.aiUsage.requests)}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Last updated: {lastUpdated ?? "—"}</span>
      </div>
    </div>
  );
}
