"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BrainCircuit, Plus, Trash2, Search, Wand2, Layers, Network } from "lucide-react";
import { api, apiPost } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/suite/PageHeader";

interface MemoryRow {
  id: string;
  content: string;
  metadata: { source?: string } | null;
  importance: number;
  lastAccessedAt: string;
  createdAt: string;
}

interface RecallRow {
  id: string;
  content: string;
  importance: number;
  score: number;
}

interface ContextBundle {
  query: string | null;
  memories: RecallRow[];
  knowledge: Array<{ id: string; name: string }>;
  recentChats: Array<{ id: string; title: string }>;
  tasks: Array<{ id: string; title: string; status: string }>;
  upcomingEvents: Array<{ id: string; title: string; startAt: string }>;
}

const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [newFact, setNewFact] = useState("");
  const [query, setQuery] = useState("");
  const [recallResults, setRecallResults] = useState<RecallRow[]>([]);
  const [context, setContext] = useState<ContextBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      setMemories(await api<MemoryRow[]>("/api/memory?ownerType=user&ownerId=me"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const remember = async () => {
    if (!newFact.trim()) return;
    await apiPost("/api/memory", {
      ownerType: "user",
      ownerId: "me",
      content: newFact.trim(),
      metadata: { source: "explicit" },
    });
    toast.success("Remembered");
    setNewFact("");
    fetchMemories();
  };

  const recall = async () => {
    if (!query.trim()) return;
    const results = await apiPost<RecallRow[]>("/api/memory/recall", {
      ownerType: "user",
      ownerId: "me",
      query: query.trim(),
      limit: 8,
    });
    setRecallResults(results);
  };

  const buildContext = async () => {
    setContextLoading(true);
    try {
      setContext(await apiPost<ContextBundle>("/api/memory/context", { query: query.trim() || undefined }));
    } finally {
      setContextLoading(false);
    }
  };

  const removeMemory = async (id: string) => {
    await api(`/api/memory/${id}`, { method: "DELETE" });
    toast.success("Removed");
    fetchMemories();
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1100px] space-y-6">
        <PageHeader
          title="Memory"
          description="Long-term memory, semantic recall, and the AI context builder."
          icon={<BrainCircuit className="h-5 w-5 text-white" />}
          actions={
            <Button size="sm" variant="outline" asChild className="gap-1.5 min-h-[36px]">
              <Link href="/memory/graph">
                <Network className="h-4 w-4" />
                Knowledge Graph
              </Link>
            </Button>
          }
        />

        {/* Remember + recall */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/40 bg-card shadow-card rounded-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Remember
              </CardTitle>
              <CardDescription className="text-xs">Teach ToneCraft a fact about you, your work, or your projects.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <textarea
                className={`${textareaClass} font-mono text-xs`}
                rows={3}
                placeholder="I prefer short sentences in marketing copy. The Q3 launch is focused on enterprise teams…"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
              />
              <Button size="sm" className="gap-1.5" onClick={remember}>
                <Plus className="h-3.5 w-3.5" />
                Save memory
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card shadow-card rounded-xl">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Semantic recall
              </CardTitle>
              <CardDescription className="text-xs">Ask — relevant memories surface by meaning, not just keywords.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="flex gap-2">
                <Input placeholder="What do I prefer for launch emails?" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Button size="sm" className="shrink-0" onClick={recall}>Search</Button>
              </div>
              {recallResults.length > 0 && (
                <div className="space-y-2 pt-1">
                  {recallResults.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border/30 bg-surface/50 p-3 space-y-1">
                      <p className="text-xs text-foreground leading-relaxed">{r.content}</p>
                      <div className="flex items-center gap-2 text-micro text-muted-foreground">
                        <Badge variant="secondary" className="text-micro">relevance {(r.score * 100).toFixed(0)}%</Badge>
                        <span>importance {r.importance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Context builder */}
        <Card className="border-border/40 bg-card shadow-card rounded-xl">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                AI Context Builder
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={buildContext} disabled={contextLoading}>
                <Layers className="h-3.5 w-3.5" />
                {contextLoading ? "Building…" : "Build context"}
              </Button>
            </div>
            <CardDescription className="text-xs">Collects relevant memories, knowledge, chats, tasks, and calendar before each request.</CardDescription>
          </CardHeader>
          {context && (
            <CardContent className="p-5 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-micro font-medium text-muted-foreground uppercase tracking-wider">Memories ({context.memories.length})</p>
                {context.memories.slice(0, 4).map((m) => (
                  <p key={m.id} className="text-xs text-foreground/80 leading-snug">• {m.content.slice(0, 90)}</p>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-micro font-medium text-muted-foreground uppercase tracking-wider">Knowledge & chats</p>
                {context.knowledge.map((k) => <p key={k.id} className="text-xs text-foreground/80">• {k.name}</p>)}
                {context.recentChats.slice(0, 3).map((c) => <p key={c.id} className="text-xs text-foreground/60">◦ {c.title}</p>)}
              </div>
              <div className="space-y-2">
                <p className="text-micro font-medium text-muted-foreground uppercase tracking-wider">Tasks & calendar</p>
                {context.tasks.slice(0, 3).map((t) => <p key={t.id} className="text-xs text-foreground/80">• {t.title}</p>)}
                {context.upcomingEvents.slice(0, 2).map((e) => <p key={e.id} className="text-xs text-foreground/60">◦ {e.title}</p>)}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Memory list */}
        <Card className="border-border/40 bg-card shadow-card rounded-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-semibold">Stored memories</CardTitle>
            <CardDescription className="text-xs">Facts ToneCraft remembers about you.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />)}
              </div>
            ) : memories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No memories yet — save your first fact above.</p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-surface/50 p-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-foreground leading-relaxed">{m.content}</p>
                    <div className="flex items-center gap-3 text-micro text-muted-foreground">
                      <span>importance {m.importance}</span>
                      <span className="capitalize">{m.metadata?.source ?? "memory"}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeMemory(m.id)} aria-label="Delete memory">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
