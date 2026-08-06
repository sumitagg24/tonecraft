"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileText, Plus, Trash2, Pin, Loader2, Eye, PencilLine,
  CheckCircle2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  content: string;
  emoji: string | null;
  status: string;
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
}

const EMOJIS = ["📝", "📄", "✍️", "🚀", "💡", "📌", "🎯", "🧠", "📊", "✨"];

const AI_ACTIONS = [
  { id: "rewrite", label: "Rewrite" },
  { id: "summarize", label: "Summarize" },
  { id: "expand", label: "Expand" },
  { id: "grammar", label: "Grammar" },
  { id: "continue", label: "Continue" },
  { id: "plan", label: "Plan" },
] as const;

const TONES = ["professional", "friendly", "casual", "formal", "funny", "creative"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = docs.find((d) => d.id === activeId) ?? null;

  const load = useCallback(async () => {
    try {
      const data = await api<Document[]>("/api/documents");
      setDocs(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchDoc = useCallback(async (id: string, data: Partial<Document>) => {
    try {
      const updated = await api<Document>(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setDocs((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return true;
    } catch {
      toast.error("Failed to save");
      return false;
    }
  }, []);

  const handleCreate = async () => {
    try {
      const doc = await apiPost<Document>("/api/documents", {
        title: "Untitled",
        content: "# Welcome 👋\n\nStart writing…",
        emoji: "📝",
      });
      setDocs((prev) => [doc, ...prev]);
      setActiveId(doc.id);
      setView("edit");
    } catch {
      toast.error("Failed to create document");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (activeId === id) setActiveId(docs.find((d) => d.id !== id)?.id ?? null);
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  // Debounced autosave on content change
  const handleContentChange = (value: string) => {
    if (!active) return;
    setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, content: value } : d)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await patchDoc(active.id, { content: value });
      setSaving(false);
    }, 800);
  };

  const runAi = async (action: string) => {
    if (!active || !active.content.trim()) return;
    setAiLoading(action);
    try {
      const result = await apiPost<{ content: string }>("/api/ai/assist", {
        action,
        text: active.content,
      });
      handleContentChange(result.content);
      toast.success("AI applied");
    } catch {
      toast.error("AI action failed");
    } finally {
      setAiLoading(null);
    }
  };

  const runAiTone = async (tone: string) => {
    if (!active) return;
    setAiLoading(`tone:${tone}`);
    try {
      const result = await apiPost<{ content: string }>("/api/ai/assist", {
        action: "tone",
        tone,
        text: active.content,
      });
      handleContentChange(result.content);
      toast.success(`Rewritten in ${tone} tone`);
    } catch {
      toast.error("Tone rewrite failed");
    } finally {
      setAiLoading(null);
    }
  };

  const markdownSource = active?.content ?? "";

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Documents"
          description="Rich markdown workspace with AI-assisted editing"
          icon={<FileText className="w-4 h-4" />}
          actions={
            <Button onClick={handleCreate} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Document
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
          {/* Document list */}
          <Card className="lg:sticky lg:top-0">
            <CardContent className="p-3">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <EmptyState
                  title="No documents yet"
                  description="Create your first document to start writing with AI."
                  action={<Button size="sm" onClick={handleCreate}><Plus className="w-3.5 h-3.5 mr-1" />Create</Button>}
                />
              ) : (
                <div className="space-y-1">
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => { setActiveId(doc.id); setView("edit"); }}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all",
                        doc.id === activeId
                          ? "bg-primary/10 text-foreground border border-primary/20"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span>{doc.emoji ?? "📝"}</span>
                      <span className="flex-1 truncate">{doc.title}</span>
                      {doc.pinned && <Pin className="w-3 h-3 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          {active ? (
            <Card>
              <CardContent className="p-5">
                {/* Title row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setEmojiOpen((v) => !v)}
                      className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted/80 border border-border/40 flex items-center justify-center text-lg transition-all"
                      aria-label="Change emoji"
                    >
                      {active.emoji ?? "📝"}
                    </button>
                    {emojiOpen && (
                      <div className="absolute top-11 left-0 z-20 grid grid-cols-5 gap-1 p-2 rounded-xl border border-border/40 bg-popover shadow-xl">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-base"
                            onClick={() => { patchDoc(active.id, { emoji: e }); setEmojiOpen(false); }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={active.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, title: v } : d)));
                      if (saveTimer.current) clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => patchDoc(active.id, { title: v }), 600);
                    }}
                    className="flex-1 min-w-[160px] h-10 font-semibold"
                  />
                  <div className="flex items-center gap-1.5 ml-auto">
                    {saving ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchDoc(active.id, { pinned: !active.pinned })}
                      className={cn(active.pinned && "text-primary")}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(active.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 mb-3 rounded-lg bg-muted/40 p-1 w-fit">
                  {(["edit", "preview"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                        view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {v === "edit" ? <PencilLine className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {v === "edit" ? "Editor" : "Preview"}
                    </button>
                  ))}
                </div>

                {/* AI assist bar */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> AI
                  </span>
                  {AI_ACTIONS.map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant="outline"
                      disabled={aiLoading !== null || !markdownSource.trim()}
                      onClick={() => runAi(a.id)}
                      className="h-7 px-2.5 text-xs"
                    >
                      {aiLoading === a.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                      {a.label}
                    </Button>
                  ))}
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => e.target.value && runAiTone(e.target.value)}
                      disabled={aiLoading !== null || !markdownSource.trim()}
                      className="h-7 rounded-md border border-border/40 bg-background px-2 text-xs text-muted-foreground hover:text-foreground outline-none"
                    >
                      <option value="">Tone…</option>
                      {TONES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {markdownSource.split(/\n/).length} blocks
                  </Badge>
                </div>

                {/* Editor / Preview */}
                {view === "edit" ? (
                  <textarea
                    value={markdownSource}
                    onChange={(e) => handleContentChange(e.target.value)}
                    spellCheck={false}
                    className="w-full h-[520px] resize-none rounded-xl border border-border/40 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/50 outline-none p-4 font-mono text-sm leading-relaxed"
                    placeholder="Write in Markdown… (## headings, - bullets, 1. numbers, **bold**)"
                  />
                ) : (
                  <div className="h-[520px] overflow-y-auto rounded-xl border border-border/40 bg-muted/20 p-6 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSource || "*Nothing to preview yet.*"}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  title="Select or create a document"
                  description="Pick a document from the list or create a new one."
                  action={<Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1.5" />New Document</Button>}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
