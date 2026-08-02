"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Pencil, Star, Loader2, Users, Check, Download, Upload, Sparkles, X,
} from "lucide-react";
import { api } from "@/lib/api-client";

export interface PersonaFormData {
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string | null;
  color: string;
  tone: string;
  temperature: number | null;
  emojiUsage: string;
  writingStyle: string;
}

export interface PersonaLibraryItem extends PersonaFormData {
  id: string;
  isDefault: boolean;
  isFavorite: boolean;
  platformDefaults: Record<string, string> | null;
  projectId: string | null;
  createdAt: string;
}

const TONES = ["professional", "friendly", "casual", "formal", "marketing", "academic", "luxury", "funny", "polite", "minimal"];
const EMOJI_USAGE = ["none", "subtle", "moderate", "heavy"];
const WRITING_STYLES = ["standard", "casual", "formal", "persuasive", "luxury"];
const PRESET_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#0EA5E9", "#B45309", "#EF4444", "#EC4899"];

const emptyForm = {
  name: "", description: "", systemPrompt: "", icon: "", color: "#6366F1",
  tone: "professional", temperature: 70, emojiUsage: "subtle", writingStyle: "standard",
} satisfies PersonaFormData;

export function PersonasLibraryPage() {
  const [personas, setPersonas] = useState<PersonaLibraryItem[]>([]);
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PersonaLibraryItem | null>(null);
  const [creating, setCreating] = useState<PersonaFormData | null>(null);
  const [curated, setCurated] = useState<Omit<PersonaLibraryItem, "id" | "isDefault" | "isFavorite" | "createdAt" | "projectId" | "description">[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ personas: PersonaLibraryItem[]; defaultPersonaId: string | null }>("/api/personas");
      setPersonas(data.personas ?? []);
      setDefaultPersonaId(data.defaultPersonaId ?? null);
    } catch {
      toast.error("Failed to load personas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ personas: PersonaLibraryItem[]; defaultPersonaId: string | null }>("/api/personas")
      .then((data) => {
        if (cancelled) return;
        setPersonas(data.personas ?? []);
        setDefaultPersonaId(data.defaultPersonaId ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    api<typeof curated>("/api/personas/curated").then(setCurated).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (id: string, data: Record<string, unknown>) => {
    return api<PersonaLibraryItem>(`/api/personas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  const setDefault = useCallback(async (id: string) => {
    try {
      await save(id, { isDefault: true });
      setDefaultPersonaId(id);
      toast.success("Default persona set");
    } catch {
      toast.error("Failed to set default");
    }
  }, [save]);

  const toggleFavorite = useCallback(async (p: PersonaLibraryItem) => {
    const next = !p.isFavorite;
    try {
      await save(p.id, { isFavorite: next });
      setPersonas((prev) => prev.map((x) => (x.id === p.id ? { ...x, isFavorite: next } : x)));
    } catch {
      toast.error("Failed to update favorite");
    }
  }, [save]);

  const remove = useCallback(async (id: string) => {
    try {
      await api(`/api/personas/${id}`, { method: "DELETE" });
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      if (defaultPersonaId === id) setDefaultPersonaId(null);
      toast.success("Persona deleted");
    } catch {
      toast.error("Failed to delete persona");
    }
  }, [defaultPersonaId]);

  const createPersona = useCallback(async (data: PersonaFormData) => {
    return api<PersonaLibraryItem>("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, []);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creating) return;
    try {
      const created = await createPersona(creating);
      setPersonas((prev) => [created, ...prev]);
      setCreating(null);
      toast.success("Persona created");
    } catch {
      toast.error("Failed to create persona");
    }
  }, [creating, createPersona]);

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const updated = await save(editing.id, {
        name: editing.name,
        description: editing.description || null,
        systemPrompt: editing.systemPrompt,
        icon: editing.icon || null,
        color: editing.color,
        tone: editing.tone,
        temperature: editing.temperature,
        emojiUsage: editing.emojiUsage,
        writingStyle: editing.writingStyle,
        isFavorite: editing.isFavorite,
      });
      setPersonas((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      setEditing(null);
      toast.success("Persona updated");
    } catch {
      toast.error("Failed to update persona");
    }
  }, [editing, save]);

  const importCurated = useCallback(async (c: typeof curated[number]) => {
    try {
      const created = await createPersona({
        name: c.name,
        description: null,
        systemPrompt: c.systemPrompt,
        icon: c.icon,
        color: c.color,
        tone: c.tone,
        temperature: c.temperature,
        emojiUsage: c.emojiUsage,
        writingStyle: c.writingStyle,
      });
      setPersonas((prev) => [created, ...prev]);
      toast.success(`Imported "${c.name}"`);
    } catch {
      toast.error("Failed to import persona");
    }
  }, [createPersona]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(personas.map((p) => ({
      name: p.name, description: p.description, systemPrompt: p.systemPrompt,
      icon: p.icon, color: p.color, tone: p.tone, temperature: p.temperature,
      emojiUsage: p.emojiUsage, writingStyle: p.writingStyle, platformDefaults: p.platformDefaults,
    })), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tonecraft-personas.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [personas]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : parsed.personas;
        if (!Array.isArray(list)) throw new Error("Invalid file");
        let count = 0;
        for (const item of list) {
          await createPersona({
            name: item.name ?? "Imported Persona",
            description: item.description ?? null,
            systemPrompt: item.systemPrompt ?? "",
            icon: item.icon ?? null,
            color: item.color ?? "#6366F1",
            tone: item.tone ?? "professional",
            temperature: item.temperature ?? 70,
            emojiUsage: item.emojiUsage ?? "subtle",
            writingStyle: item.writingStyle ?? "standard",
          });
          count++;
        }
        toast.success(`Imported ${count} personas`);
        load();
      } catch {
        toast.error("Invalid persona file");
      }
    };
    reader.readAsText(file);
  }, [createPersona, load]);

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Persona Library
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Persistent writing voices — pick one in the composer or set a default.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-input text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
          </label>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreating(emptyForm)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Persona
          </Button>
        </div>
      </div>

      {creating && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-4 mb-5 bg-muted/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Create Persona
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCreating(null)}><X className="w-4 h-4" /></Button>
          </div>
          <PersonaForm form={creating} setForm={setCreating} onSubmit={handleCreateSubmit} submitLabel="Create Persona" />
        </motion.div>
      )}

      {editing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-4 mb-5 bg-muted/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" /> Edit Persona
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
          </div>
          <PersonaForm form={editing} setForm={(v) => setEditing(v as unknown as PersonaLibraryItem)} onSubmit={handleEditSubmit} submitLabel="Save Changes" />
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : personas.length === 0 ? (
        <div className="text-center py-16 text-xs text-muted-foreground/60 space-y-4">
          <p>No personas yet.</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {curated.map((c) => (
              <button
                key={c.name}
                onClick={() => importCurated(c)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs hover:bg-muted/20 transition-colors"
                style={{ borderColor: `${c.color}44` }}
              >
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-micro" style={{ backgroundColor: `${c.color}22`, color: c.color }}>
                  {c.icon}
                </span>
                {c.name}
                <span className="text-nano text-muted-foreground/50 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> add</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <div key={p.id} className="border rounded-xl p-4 flex flex-col gap-3 bg-card hover:border-border/50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: `${p.color}22`, color: p.color }}>
                  {p.icon || p.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                    {p.name}
                    {p.id === defaultPersonaId && <Badge variant="secondary" className="text-nano px-1.5 py-0">default</Badge>}
                  </p>
                  {p.description && <p className="text-tiny text-muted-foreground/70 line-clamp-1 mt-0.5">{p.description}</p>}
                </div>
                <button
                  onClick={() => toggleFavorite(p)}
                  className="text-muted-foreground/40 hover:text-amber-500 transition-colors"
                  aria-label={p.isFavorite ? "Remove favorite" : "Add favorite"}
                >
                  <Star className={cn("w-4 h-4", p.isFavorite && "text-amber-500 fill-amber-500")} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-micro">{p.tone || "professional"}</Badge>
                <Badge variant="outline" className="text-micro">emoji: {p.emojiUsage || "subtle"}</Badge>
                {p.writingStyle && p.writingStyle !== "standard" && <Badge variant="outline" className="text-micro">{p.writingStyle}</Badge>}
              </div>
              <p className="text-tiny text-muted-foreground/50 line-clamp-2 flex-1 font-mono text-micro leading-relaxed">{p.systemPrompt}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                {p.id === defaultPersonaId ? (
                  <span className="text-micro text-muted-foreground/50 flex items-center gap-1"><Check className="w-3 h-3" /> Default</span>
                ) : (
                  <button onClick={() => setDefault(p.id)} className="text-micro text-muted-foreground/60 hover:text-primary transition-colors">
                    Set as default
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)} aria-label="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(p.id)} aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonaForm({
  form, setForm, onSubmit, submitLabel,
}: {
  form: PersonaFormData;
  setForm: (v: PersonaFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  const set = (k: keyof PersonaFormData, v: PersonaFormData[keyof PersonaFormData]) => setForm({ ...form, [k]: v });
  const fieldCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium mb-1 block">Name</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Code Reviewer" required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Icon (emoji)</label>
          <Input value={form.icon as string} onChange={(e) => set("icon", e.target.value)} placeholder="😊" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Description (optional)</label>
        <Input value={form.description as string} onChange={(e) => set("description", e.target.value)} placeholder="Brief description" />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">System Prompt</label>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => set("systemPrompt", e.target.value)}
          placeholder="You are a..."
          required
          className={cn(fieldCls, "min-h-[80px]")}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Tone</label>
          <select className={fieldCls} value={form.tone as string} onChange={(e) => set("tone", e.target.value)}>
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Writing Style</label>
          <select className={fieldCls} value={form.writingStyle as string} onChange={(e) => set("writingStyle", e.target.value)}>
            {WRITING_STYLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Emoji</label>
          <select className={fieldCls} value={form.emojiUsage as string} onChange={(e) => set("emojiUsage", e.target.value)}>
            {EMOJI_USAGE.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Temperature</label>
          <input type="number" min={0} max={100} className={fieldCls} value={form.temperature as number} onChange={(e) => set("temperature", Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              className={cn("w-6 h-6 rounded-full transition-transform", form.color === c && "ring-2 ring-offset-2 ring-offset-background scale-110")}
              style={{ backgroundColor: c, ...(form.color === c ? ({ ["--tw-ring-color" as string]: c }) : {}) }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
