"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { usePrompts } from "@/hooks/use-prompts";
import { usePromptsStore, type PromptItem, type PromptVariableDef } from "@/stores/prompts-store";
import { Modal } from "@/components/shared/Modal";
import { PageHeader } from "@/components/suite/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, X, Plus, Heart, Clock, Trash2, Pencil, Check,
  Upload, Download, Eye, Play, BookOpen, Wand2, ChevronRight, FileText,
  LayoutGrid, List as ListIcon, Filter, RefreshCw,
} from "lucide-react";

const RECENT_KEY = "tc:prompt-recent";
const MAX_RECENT = 4;

export function PromptLibraryPage({ projectId }: { projectId?: string }) {
  const { prompts, categories, loading } = usePromptsStore();
  const { fetchPrompts, createPrompt, updatePrompt, deletePrompt, toggleFavorite, renderPrompt, importPrompts } = usePrompts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTone, setSelectedTone] = useState("all");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<"all" | "favorites" | "recent">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PromptItem | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchPrompts(projectId);
  }, [fetchPrompts, projectId]);

  const rememberRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, [setRecent]);

  const filtered = useMemo(() => {
    let list = prompts;
    if (view === "favorites") list = list.filter((p) => p.isFavorite);
    if (view === "recent") list = list.filter((p) => recent.includes(p.id));
    if (selectedCategory !== "all") list = list.filter((p) => p.category === selectedCategory);
    if (selectedTone !== "all") list = list.filter((p) => (p.tone || "").toLowerCase() === selectedTone.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prompts, view, recent, selectedCategory, selectedTone, search]);

  const handleCreate = useCallback(async (data: { title: string; description?: string; content: string; category?: string; variables?: PromptVariableDef[] }) => {
    await createPrompt({ ...data, projectId });
    setEditorOpen(false);
    toast.success("Prompt created");
  }, [createPrompt, projectId]);

  const handleRun = useCallback(async (prompt: PromptItem, values: Record<string, string>) => {
    const rendered = await renderPrompt(prompt.content, values);
    rememberRecent(prompt.id);
    setRunId(null);
    setPreviewId(null);
    navigator.clipboard.writeText(rendered).catch(() => undefined);
    toast.success("Rendered prompt copied to clipboard");
  }, [renderPrompt, rememberRecent]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(prompts.map((p) => ({
      title: p.title, description: p.description, content: p.content,
      category: p.category, variables: p.variables,
    })), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tonecraft-prompts.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [prompts]);

  const handleImport = useCallback((file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.prompts;
        if (!Array.isArray(list)) throw new Error("Invalid file");
        const count = await importPrompts(list);
        toast.success(`Imported ${count} prompts`);
        fetchPrompts(projectId);
      } catch {
        toast.error("Invalid prompt file");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  }, [importPrompts, fetchPrompts, projectId]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedTone("all");
    setView("all");
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
      {/* PageHeader */}
      <PageHeader
        title="Prompt Library"
        description="Browse, search, and use saved prompts and prompt templates across conversations."
        icon={<BookOpen className="w-5 h-5 text-white" />}
        actions={
          <>
            <label className="h-8 px-3 rounded-lg border border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground hover:border-border/60 transition-all cursor-pointer">
              {importing ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Import
              <input type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
            </label>
            <button
              onClick={handleExport}
              className="h-8 px-3 rounded-lg border border-border/30 flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground hover:border-border/60 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => { setEditing(null); setEditorOpen(true); }}
              className="h-8 px-3 rounded-lg bg-brand text-brand-foreground text-xs font-medium flex items-center gap-1.5  shadow-glow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Prompt
            </button>
          </>
        }
      />

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts by title, description, category, or keywords..."
            className="w-full h-9 bg-muted/30 border border-border/30 rounded-lg pl-9 pr-8 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            aria-label="Search prompts"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground" aria-label="Clear search">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View / Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tone Selector */}
          <div className="relative">
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-border/30 bg-muted/20 text-xs text-muted-foreground hover:text-foreground outline-none focus:ring-1 focus:ring-primary/30"
              aria-label="Filter by tone"
            >
              <option value="all">All Tones</option>
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* View Filter Pills */}
          <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-lg border border-border/20">
            {(["all", "favorites", "recent"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "h-7 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all capitalize",
                  view === v ? "bg-background text-foreground shadow-sm border border-border/20" : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {v === "favorites" && <Heart className="w-3 h-3 text-amber-500 fill-amber-500" />}
                {v === "recent" && <Clock className="w-3 h-3" />}
                {v}
              </button>
            ))}
          </div>

          {/* Grid vs List toggle */}
          <div className="flex items-center gap-0.5 bg-muted/20 p-0.5 rounded-lg border border-border/20">
            <button
              onClick={() => setLayoutMode("grid")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                layoutMode === "grid" ? "bg-background text-foreground shadow-sm border border-border/20" : "text-muted-foreground/60 hover:text-foreground"
              )}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("list")}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                layoutMode === "list" ? "bg-background text-foreground shadow-sm border border-border/20" : "text-muted-foreground/60 hover:text-foreground"
              )}
              title="List view"
              aria-label="List view"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "shrink-0 px-3 py-1 rounded-full text-tiny font-medium transition-all border",
            selectedCategory === "all" ? "bg-primary/10 border-primary/30 text-primary" : "border-border/20 text-muted-foreground/70 hover:border-border/40"
          )}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-tiny font-medium transition-all border capitalize",
              selectedCategory === cat ? "bg-primary/10 border-primary/30 text-primary" : "border-border/20 text-muted-foreground/70 hover:border-border/40"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid / List Main Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          /* Loading State Skeletons */
          <div className={cn(
            layoutMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              : "flex flex-col gap-2"
          )}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/20 bg-card/40 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-4 h-4 rounded-full" />
                </div>
                <Skeleton className="w-3/4 h-4 rounded" />
                <Skeleton className="w-full h-10 rounded" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="w-16 h-4 rounded-full" />
                  <Skeleton className="w-14 h-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/30 bg-muted/5 p-6">
            <div className="w-12 h-12 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mb-3">
              {search || selectedCategory !== "all" || selectedTone !== "all" || view !== "all" ? (
                <Filter className="w-6 h-6 text-muted-foreground/40" />
              ) : (
                <FileText className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>
            <h5 className="text-base font-semibold text-foreground">
              {search || selectedCategory !== "all" || selectedTone !== "all" || view !== "all"
                ? "No prompts match your search"
                : "No saved prompts"}
            </h5>
            <p className="text-xs text-muted-foreground/60 max-w-sm mt-1 mb-4">
              {search || selectedCategory !== "all" || selectedTone !== "all" || view !== "all"
                ? "Try adjusting your search query, category, or tone filter."
                : "Create custom prompt templates to reuse across your conversations."}
            </p>
            {search || selectedCategory !== "all" || selectedTone !== "all" || view !== "all" ? (
              <button
                onClick={clearFilters}
                className="h-8 px-4 rounded-lg border border-border/30 text-xs font-medium flex items-center gap-1.5 hover:bg-muted/30 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => { setEditing(null); setEditorOpen(true); }}
                className="h-8 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-medium shadow-glow  transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Prompt
              </button>
            )}
          </div>
        ) : layoutMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onToggleFavorite={() => toggleFavorite(prompt.id, !prompt.isFavorite)}
                onEdit={() => { setEditing(prompt); setEditorOpen(true); }}
                onDelete={() => deletePrompt(prompt.id)}
                onPreview={() => setPreviewId(prompt.id)}
                onRun={() => { rememberRecent(prompt.id); setRunId(prompt.id); setPreviewId(prompt.id); }}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-2">
            {filtered.map((prompt) => (
              <PromptListItem
                key={prompt.id}
                prompt={prompt}
                onToggleFavorite={() => toggleFavorite(prompt.id, !prompt.isFavorite)}
                onEdit={() => { setEditing(prompt); setEditorOpen(true); }}
                onDelete={() => deletePrompt(prompt.id)}
                onPreview={() => setPreviewId(prompt.id)}
                onRun={() => { rememberRecent(prompt.id); setRunId(prompt.id); setPreviewId(prompt.id); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor dialog */}
      <AnimatePresence>
        {editorOpen && (
          <PromptEditor
            initial={editing}
            categories={categories}
            onClose={() => setEditorOpen(false)}
            onSave={async (data) => {
              if (editing) {
                await updatePrompt(editing.id, data);
                setEditorOpen(false);
                toast.success("Prompt updated");
              } else {
                await handleCreate(data);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview / run dialog */}
      <AnimatePresence>
        {previewId && (() => {
          const prompt = prompts.find((p) => p.id === previewId);
          if (!prompt) return null;
          return (
            <PromptRunDialog
              key={prompt.id}
              prompt={prompt}
              onClose={() => { setPreviewId(null); setRunId(null); }}
              onRun={(values) => handleRun(prompt, values)}
              autoRun={runId === prompt.id}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function PromptCard({
  prompt, onToggleFavorite, onEdit, onDelete, onPreview, onRun,
}: {
  prompt: PromptItem; onToggleFavorite: () => void; onEdit: () => void;
  onDelete: () => void; onPreview: () => void; onRun: () => void;
}) {
  return (
    <div className="group relative p-4 rounded-xl border border-border/20 bg-background/30 hover:border-border/40 hover:bg-muted/20 transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-brand/10 border border-border/20 flex items-center justify-center shrink-0">
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        <button
          onClick={onToggleFavorite}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={prompt.isFavorite ? "Remove favorite" : "Add favorite"}
        >
          <Heart className={cn("w-4 h-4", prompt.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40")} />
        </button>
      </div>
      <h3 className="text-sm font-semibold mb-1 truncate">{prompt.title}</h3>
      <p className="text-tiny text-muted-foreground/60 line-clamp-2 mb-3 min-h-[2rem]">
        {prompt.description || prompt.content}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-micro px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/70 capitalize">{prompt.category}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onPreview} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Preview"><Eye className="w-3.5 h-3.5" /></button>
          <button onClick={onRun} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Run"><Play className="w-3.5 h-3.5" /></button>
          <button onClick={onEdit} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

function PromptListItem({
  prompt, onToggleFavorite, onEdit, onDelete, onPreview, onRun,
}: {
  prompt: PromptItem; onToggleFavorite: () => void; onEdit: () => void;
  onDelete: () => void; onPreview: () => void; onRun: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/20 bg-background/30 hover:border-border/40 hover:bg-muted/20 transition-all">
      <div className="w-8 h-8 rounded-lg bg-brand/10 border border-border/20 flex items-center justify-center shrink-0">
        <Wand2 className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate">{prompt.title}</h3>
        <p className="text-tiny text-muted-foreground/60 truncate">
          {prompt.description || prompt.content}
        </p>
      </div>
      <span className="text-micro px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/70 capitalize shrink-0">{prompt.category}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onPreview} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Preview"><Eye className="w-3.5 h-3.5" /></button>
        <button onClick={onRun} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Run"><Play className="w-3.5 h-3.5" /></button>
        <button onClick={onEdit} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/40" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        <button onClick={onToggleFavorite} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-amber-500" aria-label={prompt.isFavorite ? "Remove favorite" : "Add favorite"}>
          <Heart className={cn("w-3.5 h-3.5", prompt.isFavorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/40")} />
        </button>
      </div>
    </div>
  );
}

function PromptEditor({
  initial, categories, onClose, onSave,
}: {
  initial: PromptItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (data: { title: string; description?: string; content: string; category?: string; variables?: PromptVariableDef[] }) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "general");
  const [variables, setVariables] = useState<PromptVariableDef[]>(initial?.variables ?? []);

  const detectedVariables = useMemo(() => {
    const names = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) names.add(m[1]);
    return [...names];
  }, [content]);

  const variableNames = new Set(variables.map((v) => v.name));

  const save = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
      category: category || undefined,
      variables: variables.length > 0 ? variables : undefined,
    });
  };

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={initial ? "Edit Prompt" : "New Prompt"}
      contentClassName="max-h-[85vh] overflow-y-auto scrollbar-thin"
    >
      <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground/70">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Cold outreach email" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground/70">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="Short description" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground/70">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. email, social, writing" list="prompt-categories" />
            <datalist id="prompt-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground/70">
              Template <span className="text-muted-foreground/40">(use {"{{variable}}"} placeholders)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full min-h-[120px] bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-xs"
              placeholder="Write a professional email about {{topic}} addressed to {{recipient}}"
            />
          </div>

          {detectedVariables.length > 0 && (
            <div className="rounded-xl border border-border/20 bg-muted/10 p-3">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground/70">
                <ChevronRight className="w-3 h-3" />
                Variables
              </div>
              <div className="space-y-2">
                {detectedVariables.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-tiny font-mono text-primary px-1.5 py-0.5 rounded bg-primary/10">{"{{" + name + "}}"}</span>
                    <input
                      value={variableNames.has(name) ? variables.find((v) => v.name === name)?.label ?? "" : ""}
                      onChange={(e) => {
                        setVariables((prev) => {
                          const next = prev.filter((v) => v.name !== name);
                          if (e.target.value) next.push({ name, label: e.target.value });
                          return next;
                        });
                      }}
                      placeholder="Label (optional)"
                      className="flex-1 h-7 bg-muted/40 border border-border/30 rounded-md px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-8 px-4 rounded-lg text-xs text-muted-foreground/70 hover:text-foreground border border-border/30 transition-all">Cancel</button>
          <button onClick={save} className="h-8 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-medium shadow-glow  transition-all flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
    </Modal>
  );
}

function PromptRunDialog({
  prompt, onClose, onRun, autoRun,
}: {
  prompt: PromptItem;
  onClose: () => void;
  onRun: (values: Record<string, string>) => void;
  autoRun?: boolean;
}) {
  const { renderPrompt } = usePrompts();
  const variableDefs = useMemo(() => prompt.variables ?? [], [prompt.variables]);
  const detected = useMemo(() => {
    const names = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(prompt.content)) !== null) names.add(m[1]);
    return [...names];
  }, [prompt.content]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const allVars = useMemo(() => {
    const map = new Map<string, PromptVariableDef>();
    for (const v of variableDefs) map.set(v.name, v);
    for (const name of detected) if (!map.has(name)) map.set(name, { name });
    return [...map.values()];
  }, [variableDefs, detected]);

  const run = useCallback(async () => {
    try {
      const rendered = await renderPrompt(prompt.content, values);
      setPreview(rendered);
    } catch {
      toast.error("Failed to render");
    }
  }, [renderPrompt, prompt.content, values]);

  useEffect(() => {
    if (autoRun) {
      const timer = setTimeout(run, 0);
      return () => clearTimeout(timer);
    }
  }, [autoRun, run]);

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={`▶ ${prompt.title}`}
      contentClassName="max-h-[85vh] overflow-y-auto scrollbar-thin"
    >
      {allVars.length > 0 && (
          <div className="space-y-2.5 mb-4">
            {allVars.map((v) => (
              <div key={v.name}>
                <label className="text-xs font-medium text-muted-foreground/70 capitalize">{v.label || v.name}</label>
                {v.options && v.options.length > 0 ? (
                  <select
                    value={values[v.name] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                    className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select…</option>
                    {v.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={values[v.name] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
                    className="mt-1 w-full h-9 bg-muted/30 border border-border/40 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={v.label || v.name}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {preview !== null && (
          <div className="rounded-xl border border-border/20 bg-muted/10 p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground/70">
              <Eye className="w-3 h-3" /> Preview
            </div>
            <p className="text-xs whitespace-pre-wrap text-foreground/80 max-h-48 overflow-y-auto scrollbar-thin">{preview}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-8 px-4 rounded-lg text-xs text-muted-foreground/70 hover:text-foreground border border-border/30 transition-all">Close</button>
          <button onClick={run} className="h-8 px-4 rounded-lg text-xs border border-border/30 hover:border-border/60 transition-all flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={() => onRun(values)} className="h-8 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-medium shadow-glow  transition-all flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> Run &amp; Copy
          </button>
        </div>
    </Modal>
  );
}
