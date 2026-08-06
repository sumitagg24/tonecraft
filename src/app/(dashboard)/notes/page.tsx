"use client";
import { useCallback, useEffect, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/suite/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StickyNote, Plus, Trash2, Pin, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: string;
}

const COLORS: Record<string, string> = {
  default: "bg-card border-border/40",
  yellow: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
  green: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  blue: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
  pink: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
  violet: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
};

const COLOR_KEYS = Object.keys(COLORS);

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftColor, setDraftColor] = useState("default");

  const load = useCallback(async () => {
    try {
      setNotes(await api<Note[]>("/api/notes"));
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({ id: "", title: "", content: "", color: "default", pinned: false, updatedAt: "" });
    setDraftTitle("");
    setDraftContent("");
    setDraftColor("default");
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setDraftColor(note.color);
  };

  const save = async () => {
    if (!editing) return;
    try {
      if (editing.id) {
        const updated = await api<Note>(`/api/notes/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draftTitle, content: draftContent, color: draftColor }),
        });
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const created = await apiPost<Note>("/api/notes", {
          title: draftTitle,
          content: draftContent,
          color: draftColor,
        });
        setNotes((prev) => [created, ...prev]);
      }
      setEditing(null);
    } catch {
      toast.error("Failed to save note");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await api(`/api/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const togglePin = async (note: Note) => {
    try {
      const updated = await api<Note>(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      toast.error("Failed to update note");
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Notes"
          description="Quick capture, color-coded and pinnable"
          icon={<StickyNote className="w-4 h-4" />}
          actions={<Button onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" />New Note</Button>}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            description="Capture ideas, lists, and quick thoughts."
            action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-1.5" />New Note</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card key={note.id} className={cn("relative group", COLORS[note.color] ?? COLORS.default)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      className="flex-1 text-left font-semibold text-sm truncate hover:underline"
                      onClick={() => openEdit(note)}
                    >
                      {note.title || "Untitled"}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => togglePin(note)} className={cn("p-1 rounded-md hover:bg-muted/60", note.pinned && "text-primary opacity-100")} aria-label="Pin note">
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(note.id)} className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-destructive" aria-label="Delete note">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    className="text-left text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6 w-full"
                    onClick={() => openEdit(note)}
                  >
                    {note.content || "Empty note…"}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Editor modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
            <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{editing.id ? "Edit note" : "New note"}</h2>
                  <button onClick={() => setEditing(null)} className="p-1.5 rounded-md hover:bg-muted/60"><X className="w-4 h-4" /></button>
                </div>
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full h-10 rounded-lg border border-border/40 bg-muted/20 px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                />
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Write your note…"
                  rows={6}
                  className="w-full rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-none"
                />
                <div className="flex items-center gap-2">
                  {COLOR_KEYS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDraftColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all",
                        COLORS[c].split(" ")[0] === "bg-card" ? "bg-card border-border/40" : COLORS[c].split(" ")[0],
                        draftColor === c && "ring-2 ring-primary/60 border-foreground/20"
                      )}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={save} className="gap-1.5"><Check className="w-4 h-4" />Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
