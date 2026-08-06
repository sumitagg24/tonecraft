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
  Bot, Plus, Trash2, Loader2, Play, History, Link2, MemoryStick, X, Check, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  role: string;
  icon: string;
  color: string;
  isActive: boolean;
  _count?: { runs: number };
}

interface RunStep {
  agentId: string;
  name: string;
  input: string;
  output: string;
}

interface AgentRun {
  id: string;
  agentId: string;
  input: string;
  output: string | null;
  status: string;
  steps: RunStep[] | null;
  error: string | null;
  durationMs: number | null;
  createdAt: string;
}

const PRESETS: { name: string; icon: string; color: string; description: string; role: string }[] = [
  {
    name: "Writer",
    icon: "✍️",
    color: "#6366F1",
    description: "Drafts compelling copy from rough ideas",
    role: "You are a professional writer. Produce polished, well-structured drafts. Preserve the user's intent and voice, and return only the finished text.",
  },
  {
    name: "Editor",
    icon: "🔍",
    color: "#10B981",
    description: "Reviews, tightens, and polishes drafts",
    role: "You are a meticulous editor. Critique and improve the given text: fix structure, clarity, grammar, and flow. Explain major changes briefly, then return the revised text.",
  },
  {
    name: "Researcher",
    icon: "🧪",
    color: "#F59E0B",
    description: "Analyzes topics and surfaces key facts",
    role: "You are a research analyst. Break down the topic into key facts, evidence, and open questions. Be objective and flag uncertainty clearly.",
  },
  {
    name: "Summarizer",
    icon: "📌",
    color: "#EC4899",
    description: "Condenses long content into key points",
    role: "You are a summarizer. Return a tight, well-organized summary preserving all key points, numbers, and decisions.",
  },
  {
    name: "Planner",
    icon: "🧭",
    color: "#06B6D4",
    description: "Turns goals into step-by-step plans",
    role: "You are a planning engine. Produce a clear, actionable step-by-step plan with phases, owners, and success criteria.",
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", role: "", icon: "🤖", color: "#6366F1" });
  const [saving, setSaving] = useState(false);
  const [runAgentId, setRunAgentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [chainIds, setChainIds] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AgentRun | null>(null);
  const [history, setHistory] = useState<AgentRun[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    try {
      setAgents(await api<Agent[]>("/api/agents"));
    } catch {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadHistory = async (agentId: string) => {
    try {
      setHistory(await api<AgentRun[]>(`/api/agents/${agentId}/runs`));
    } catch {
      toast.error("Failed to load run history");
    }
  };

  const selectAgent = (agent: Agent) => {
    setRunAgentId(agent.id);
    setResult(null);
    setShowHistory(false);
    loadHistory(agent.id);
  };

  const saveAgent = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await apiPost<Agent>("/api/agents", {
        name: form.name,
        description: form.description,
        role: form.role,
        icon: form.icon,
        color: form.color,
      });
      setModalOpen(false);
      setForm({ name: "", description: "", role: "", icon: "🤖", color: "#6366F1" });
      await load();
      toast.success("Agent created");
    } catch {
      toast.error("Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  const addPresets = async () => {
    setSaving(true);
    try {
      for (const p of PRESETS) {
        await apiPost("/api/agents", p);
      }
      await load();
      toast.success("Specialized agents added");
    } catch {
      toast.error("Failed to add preset agents");
    } finally {
      setSaving(false);
    }
  };

  const removeAgent = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try {
      await api(`/api/agents/${id}`, { method: "DELETE" });
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (runAgentId === id) setRunAgentId(null);
    } catch {
      toast.error("Failed to delete agent");
    }
  };

  const run = async () => {
    if (!runAgentId || !input.trim() || running) return;
    setRunning(true);
    setResult(null);
    try {
      const run = await apiPost<AgentRun>(`/api/agents/${runAgentId}/run`, {
        input: input.trim(),
        chain: chainIds,
      });
      setResult(run);
      await loadHistory(runAgentId);
      toast.success("Agent run completed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Agent run failed");
      if (runAgentId) loadHistory(runAgentId);
    } finally {
      setRunning(false);
    }
  };

  const activeAgent = agents.find((a) => a.id === runAgentId) ?? null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <PageHeader
          title="AI Agents"
          description="Specialized agents, multi-agent chains, and memory"
          icon={<Bot className="w-4 h-4" />}
          actions={
            <>
              <Button variant="outline" onClick={addPresets} disabled={saving} className="gap-1.5">
                <Cpu className="w-4 h-4" /> Add presets
              </Button>
              <Button onClick={() => setModalOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> New Agent
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
          {/* Agent list */}
          <Card>
            <CardContent className="p-3 space-y-2">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />)}
                </div>
              ) : agents.length === 0 ? (
                <EmptyState
                  title="No agents yet"
                  description="Create custom agents or add the built-in specialists."
                  action={<Button size="sm" onClick={addPresets}><Cpu className="w-3.5 h-3.5 mr-1.5" />Add presets</Button>}
                />
              ) : (
                agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                      runAgentId === agent.id
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/40 hover:bg-muted/30"
                    )}
                    onClick={() => selectAgent(agent)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${agent.color}22` }}
                    >
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.description || agent.role.slice(0, 40)}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{agent._count?.runs ?? 0}</Badge>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={`Delete ${agent.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Run console */}
          {activeAgent ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${activeAgent.color}22` }}>
                      {activeAgent.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold">{activeAgent.name}</h2>
                      <p className="text-xs text-muted-foreground line-clamp-1">{activeAgent.role}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setShowHistory((v) => !v); loadHistory(activeAgent.id); }} className="gap-1.5">
                      <History className="w-3.5 h-3.5" /> {showHistory ? "Hide history" : "History"}
                    </Button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Input</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      rows={4}
                      placeholder="What should this agent do?"
                      className="w-full rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Chain (multi-agent workflow)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {agents.filter((a) => a.id !== activeAgent.id).map((a) => (
                        <button
                          key={a.id}
                          onClick={() =>
                            setChainIds((prev) =>
                              prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                            )
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs border transition-all flex items-center gap-1.5",
                            chainIds.includes(a.id)
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/40 text-muted-foreground hover:border-border/70"
                          )}
                        >
                          <span>{a.icon}</span>{a.name}
                        </button>
                      ))}
                      {agents.length <= 1 && (
                        <span className="text-xs text-muted-foreground/60">Add more agents to chain them together.</span>
                      )}
                    </div>
                    {chainIds.length > 0 && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                        Each agent&apos;s output feeds the next: {activeAgent.icon} {activeAgent.name} →{" "}
                        {chainIds.map((id) => agents.find((a) => a.id === id)?.icon).join(" → ")}. Results are stored per step.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={run} disabled={running || !input.trim()} className="gap-1.5">
                      {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      {running ? "Running…" : chainIds.length > 0 ? "Run chain" : "Run agent"}
                    </Button>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      <MemoryStick className="w-3 h-3" /> Agent memory: last 3 runs are recalled automatically
                    </span>
                  </div>
                </CardContent>
              </Card>

              {result && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Run result</h3>
                      <Badge className={cn(
                        result.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        result.status === "failed" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      )}>
                        {result.status}
                      </Badge>
                    </div>
                    {result.steps && result.steps.length > 1 && (
                      <div className="space-y-2">
                        {result.steps.map((step, i) => (
                          <div key={i} className="rounded-lg border border-border/30 bg-muted/20 p-3">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                              Step {i + 1} · {step.name}
                            </p>
                            <p className="text-xs whitespace-pre-wrap line-clamp-6">{step.output}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="rounded-lg border border-border/30 p-3 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                      {result.output}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showHistory && (
                <Card>
                  <CardContent className="p-5 space-y-2">
                    <h3 className="text-sm font-semibold mb-2">Run history</h3>
                    {history.length === 0 && <p className="text-xs text-muted-foreground/60">No runs yet.</p>}
                    {history.map((run) => (
                      <div key={run.id} className="rounded-lg border border-border/30 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px]">{run.status}</Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(run.createdAt).toLocaleString()} · {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                          </span>
                          {run.steps && run.steps.length > 1 && (
                            <Badge variant="outline" className="text-[10px]">chain ×{run.steps.length}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">In: {run.input}</p>
                        <p className="text-xs line-clamp-2 mt-0.5">Out: {run.output ?? run.error ?? "…"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  title="Select an agent"
                  description="Pick an agent from the list, or create your own."
                  action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-1.5" />New Agent</Button>}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Create agent</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-md hover:bg-muted/60"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-border/40" style={{ backgroundColor: `${form.color}22` }}>
                  {form.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {["🤖", "✍️", "🔍", "🧪", "📌", "🧭", "🎨", "⚡"].map((ic) => (
                      <button key={ic} onClick={() => setForm((f) => ({ ...f, icon: ic }))} className={cn("w-8 h-8 rounded-lg text-base hover:bg-muted/60", form.icon === ic && "bg-primary/10 ring-1 ring-primary/40")}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"].map((c) => (
                      <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))} className="w-5 h-5 rounded-full" style={{ backgroundColor: c, outline: form.color === c ? "2px solid var(--foreground)" : undefined }} aria-label={`Color ${c}`} />
                    ))}
                  </div>
                </div>
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Agent name"
                className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <textarea
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                rows={4}
                placeholder="System prompt / role — e.g. You are a professional writer…"
                className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={saveAgent} disabled={saving || !form.name.trim()} className="gap-1.5">
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
