"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Workflow, Plus, Trash2, Loader2, Play, Clock, CalendarClock, X, Check,
  Zap, BellRing, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  cron: string | null;
  prompt: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

const TRIGGER_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  custom: "Custom",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", trigger: "daily", cron: "", prompt: "" });
  const [saving, setSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setAutomations(await api<Automation[]>("/api/automations"));
    } catch {
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.name.trim() || !form.prompt.trim()) return;
    setSaving(true);
    try {
      await apiPost<Automation>("/api/automations", {
        name: form.name,
        description: form.description,
        trigger: form.trigger,
        cron: form.trigger === "custom" ? form.cron || null : null,
        prompt: form.prompt,
      });
      setModalOpen(false);
      setForm({ name: "", description: "", trigger: "daily", cron: "", prompt: "" });
      await load();
      toast.success("Automation created");
    } catch {
      toast.error("Failed to create automation");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    try {
      await api(`/api/automations/${id}`, { method: "DELETE" });
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Failed to delete automation");
    }
  };

  const toggle = async (automation: Automation) => {
    try {
      const updated = await api<Automation>(`/api/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !automation.enabled }),
      });
      setAutomations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch {
      toast.error("Failed to update automation");
    }
  };

  const runNow = async (automation: Automation) => {
    setRunningId(automation.id);
    try {
      const result = await apiPost<{ output: string; nextRunAt: string | null }>(
        `/api/automations/${automation.id}/run`
      );
      setOutputs((prev) => ({ ...prev, [automation.id]: result.output }));
      setAutomations((prev) =>
        prev.map((a) => (a.id === automation.id ? { ...a, lastRunAt: new Date().toISOString(), nextRunAt: result.nextRunAt } : a))
      );
      toast.success("Automation ran");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Automation run failed");
    } finally {
      setRunningId(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <PageHeader
          title="Automations"
          description="Scheduled prompts and recurring AI tasks"
          icon={<Workflow className="w-4 h-4" />}
          actions={
            <Button onClick={() => setModalOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Automation
            </Button>
          }
        />

        {/* Workflow shape */}
        <Card className="bg-brand/5">
          <CardContent className="p-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5 text-primary" /> Trigger</span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5 font-medium"><Zap className="w-3.5 h-3.5 text-amber-500" /> AI task</span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5 font-medium"><FileText className="w-3.5 h-3.5 text-emerald-500" /> Output</span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1.5 font-medium"><BellRing className="w-3.5 h-3.5 text-rose-400" /> Notify</span>
            <span className="ml-auto text-muted-foreground/60">Schedule is stored on the automation; a cron worker would consume it in production.</span>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : automations.length === 0 ? (
          <EmptyState
            title="No automations yet"
            description="Set up a recurring AI task — daily standup, weekly digest, or a custom schedule."
            action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-1.5" />New Automation</Button>}
          />
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => (
              <Card key={automation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Workflow className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sm">{automation.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{TRIGGER_LABEL[automation.trigger] ?? automation.trigger}</Badge>
                        {automation.cron && <Badge variant="outline" className="text-[10px] font-mono">{automation.cron}</Badge>}
                        <Badge className={cn(
                          "text-[10px]",
                          automation.enabled
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border/30"
                        )}>
                          {automation.enabled ? "Enabled" : "Paused"}
                        </Badge>
                      </div>
                      {automation.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{automation.description}</p>
                      )}
                      <p className="text-xs mt-1.5 text-muted-foreground/80 line-clamp-2">{automation.prompt}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground/70">
                        <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Next: {formatDate(automation.nextRunAt)}</span>
                        <span>Last run: {formatDate(automation.lastRunAt)}</span>
                      </div>
                      {outputs[automation.id] && (
                        <div className="mt-2 rounded-lg border border-border/30 bg-muted/20 p-3 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                          {outputs[automation.id]}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => runNow(automation)} disabled={runningId === automation.id} className="gap-1.5 h-8">
                        {runningId === automation.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Run now
                      </Button>
                      <button
                        onClick={() => toggle(automation)}
                        className={cn(
                          "h-7 w-11 rounded-full p-1 transition-colors relative",
                          automation.enabled ? "bg-emerald-500/80" : "bg-muted"
                        )}
                        aria-label="Toggle automation"
                      >
                        <span className={cn("block w-5 h-5 rounded-full bg-white shadow transition-transform", automation.enabled && "translate-x-4")} />
                      </button>
                      <button onClick={() => remove(automation.id)} className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-destructive" aria-label="Delete automation">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">New automation</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-md hover:bg-muted/60"><X className="w-4 h-4" /></button>
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name — e.g. Morning standup"
                className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <div className="flex gap-2">
                {(["daily", "weekly", "custom"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, trigger: t }))}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg border text-sm capitalize transition-all",
                      form.trigger === t
                        ? "border-primary/40 bg-primary/10 font-medium"
                        : "border-border/40 text-muted-foreground hover:border-border/70"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {form.trigger === "custom" && (
                <input
                  value={form.cron}
                  onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))}
                  placeholder="Cron — e.g. 9 17 * * 1-5"
                  className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 font-mono text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                />
              )}
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                rows={4}
                placeholder="The AI task to run on schedule — e.g. Write a 3-bullet standup summary of my open tasks and drafts."
                className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving || !form.name.trim() || !form.prompt.trim()} className="gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
