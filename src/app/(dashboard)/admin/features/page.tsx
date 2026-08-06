"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Flag, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface FlagEntry {
  key: string;
  label: string;
  description: string;
  enabledPlans: string[];
  override: boolean | null;
}

interface FlagsResponse {
  flags: FlagEntry[];
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchWorkspaceId = useCallback(async (): Promise<string | null> => {
    const workspaces = await api<Array<{ id: string }>>("/api/workspaces");
    return workspaces?.[0]?.id ?? null;
  }, []);

  const fetchData = useCallback(async () => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setLoading(true);
    try {
      const d = await api<FlagsResponse>(`/api/admin/feature-flags?workspaceId=${workspaceId}`);
      setFlags(d.flags);
    } catch {
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = useCallback(async (key: string, enabled: boolean) => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setUpdating(key);
    try {
      await api(`/api/admin/feature-flags?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, enabled }),
      });
      toast.success(`${enabled ? "Enabled" : "Disabled"} ${key} without deploy`);
      fetchData();
    } catch {
      toast.error("Failed to update flag");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId, fetchData]);

  const clearOverride = useCallback(async (key: string) => {
    const workspaceId = await fetchWorkspaceId();
    if (!workspaceId) return;
    setUpdating(key);
    try {
      await api(`/api/admin/feature-flags?workspaceId=${workspaceId}&key=${key}`, { method: "DELETE" });
      toast.success(`Reverted ${key} to plan default`);
      fetchData();
    } catch {
      toast.error("Failed to clear override");
    } finally {
      setUpdating(null);
    }
  }, [fetchWorkspaceId, fetchData]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-5 h-5 text-primary" />
            Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toggle platform features at runtime — no deployment required
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Runtime overrides</CardTitle>
          <CardDescription>
            Overrides beat plan defaults. Clear an override to return to the plan-based behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {flags.map((flag) => {
              const effective = flag.override ?? flag.enabledPlans.includes("free");
              return (
                <div
                  key={flag.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/20 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{flag.label}</span>
                      <code className="text-micro text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">{flag.key}</code>
                      {flag.override !== null && (
                        <Badge variant={flag.override ? "default" : "secondary"}>
                          Override: {flag.override ? "ON" : "OFF"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Plans: {flag.enabledPlans.map((p) => PLAN_LABELS[p] ?? p).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {flag.override !== null && (
                      <Button variant="ghost" size="sm" onClick={() => clearOverride(flag.key)} disabled={updating === flag.key}>
                        Reset
                      </Button>
                    )}
                    <button
                      onClick={() => toggle(flag.key, !effective)}
                      disabled={updating === flag.key}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all",
                        effective
                          ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                          : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                      )}
                      aria-pressed={effective}
                    >
                      {effective ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {effective ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
