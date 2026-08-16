"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProviderStatus {
  name: string;
  status: "healthy" | "degraded" | "offline";
  lastChecked: string;
  latencyMs?: number;
}

interface HealthPayload {
  status: "healthy" | "degraded" | "offline";
  checkedAt: string;
  providers: Record<string, ProviderStatus>;
}

const ICONS: Record<string, React.ElementType> = {
  database: Database,
  redis: Server,
  clerk: Activity,
  paddle: Activity,
};

const LABELS: Record<string, string> = {
  database: "PostgreSQL",
  redis: "Redis (Upstash)",
  clerk: "Clerk Auth",
  paddle: "Paddle Billing",
};

// AI backends are intentionally aggregated — we never disclose which third-party
// model infrastructure powers the writing engine.
const AI_PROVIDER_KEYS = ["groq", "gemini", "openrouter"];
const FALLBACK_NAMES = ["database", "redis", "ai", "clerk", "paddle"];

function StatusPill({ status }: { status: ProviderStatus["status"] }) {
  const styles = {
    healthy: "bg-success/10 text-success border-success/20",
    degraded: "bg-warning/10 text-warning border-warning/20",
    offline: "bg-destructive/10 text-destructive border-destructive/20",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {status === "healthy" ? <CheckCircle2 className="h-3 w-3" /> : status === "degraded" ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Could not reach the health endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const overall = data?.status ?? "offline";
  const providers = data?.providers ?? {};

  const knownKeys = Object.keys(providers).length ? Object.keys(providers) : FALLBACK_NAMES;
  const aiNames = knownKeys.filter((k) => AI_PROVIDER_KEYS.includes(k));
  const infraNames = knownKeys.filter((k) => !AI_PROVIDER_KEYS.includes(k) && k !== "ai");

  // Aggregate the AI backends into one neutral "AI Services" row (worst status, avg latency).
  const aiStatuses = aiNames.map((n) => providers[n]?.status).filter(Boolean) as ProviderStatus["status"][];
  const aiStatus: ProviderStatus["status"] = aiStatuses.length === 0
    ? "offline"
    : aiStatuses.includes("offline")
      ? "offline"
      : aiStatuses.includes("degraded")
        ? "degraded"
        : "healthy";
  const aiLatencies = aiNames
    .map((n) => providers[n]?.latencyMs)
    .filter((l): l is number => typeof l === "number");
  const aiLatencyMs = aiLatencies.length
    ? Math.round(aiLatencies.reduce((a, b) => a + b, 0) / aiLatencies.length)
    : undefined;

  return (
    <main id="main-content" className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <div className="rounded-2xl border border-border/40 bg-card shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(var(--brand)/0.5)]">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">ToneCraft Status</h1>
                <p className="text-xs text-muted-foreground">Service health overview</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setLoading(true); void load(); }} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>

          <div className="px-6 py-5">
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  overall === "healthy" ? "bg-success animate-pulse" : overall === "degraded" ? "bg-warning animate-pulse" : "bg-destructive"
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{overall}</p>
                <p className="text-xs text-muted-foreground">
                  {data ? `Checked ${new Date(data.checkedAt).toLocaleTimeString()}` : "Waiting for health data…"}
                </p>
              </div>
              <StatusPill status={overall} />
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {infraNames.map((name) => {
                const p = providers[name];
                const Icon = ICONS[name] ?? Server;
                const status = p?.status ?? "offline";
                return (
                  <div key={name} className="flex items-center gap-3 rounded-xl border border-border/30 px-3.5 py-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      status === "healthy" ? "bg-success/10 text-success" : status === "degraded" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{LABELS[name] ?? name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p?.latencyMs != null ? `${p.latencyMs}ms` : "—"}
                      </p>
                    </div>
                    <StatusPill status={status} />
                  </div>
                );
              })}

              {/* AI Services — one neutral aggregated row */}
              <div className="flex items-center gap-3 rounded-xl border border-border/30 px-3.5 py-3">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  aiStatus === "healthy" ? "bg-success/10 text-success" : aiStatus === "degraded" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                )}>
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">AI Services</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {aiLatencyMs != null ? `${aiLatencyMs}ms` : "—"}
                  </p>
                </div>
                <StatusPill status={aiStatus} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
