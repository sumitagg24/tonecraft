"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { PickerSurface } from "./PickerSurface";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import { Star, Pencil, User } from "lucide-react";
import { api } from "@/lib/api-client";
import type { PersonaRecord } from "@/services/PersonaService";

const FAVORITES_KEY = "tc:persona-favorites";
const RECENT_KEY = "tc:persona-recent";
const MAX_RECENT = 4;

export function PersonaPicker({
  onClose,
  onEdit,
  className,
}: {
  onClose: () => void;
  onEdit?: (personaId: string) => void;
  className?: string;
}) {
  const selectedPersona = useChatStore((s) => s.selectedPersona);
  const setSelectedPersona = useChatStore((s) => s.setSelectedPersona);
  const [personas, setPersonas] = useState<PersonaRecord[]>([]);
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    api<{ personas: PersonaRecord[]; defaultPersonaId: string | null }>("/api/personas")
      .then((data) => {
        if (cancelled) return;
        setPersonas(data.personas ?? []);
        setDefaultPersonaId(data.defaultPersonaId ?? null);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const rememberRecent = useCallback((id: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedPersona(id);
    rememberRecent(id);
    onClose();
  }, [setSelectedPersona, rememberRecent, onClose]);

  const favoritePersonas = useMemo(() => personas.filter((p) => favorites.includes(p.id)), [personas, favorites]);
  const recentPersonas = useMemo(() => personas.filter((p) => recent.includes(p.id) && p.id !== selectedPersona), [personas, recent, selectedPersona]);
  const others = useMemo(() => personas.filter((p) => !favorites.includes(p.id) && !recent.includes(p.id)), [personas, favorites, recent]);

  const renderRow = (p: PersonaRecord, isDefault: boolean) => (
    <button
      key={p.id}
      onClick={() => select(p.id)}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all",
        selectedPersona === p.id ? "bg-muted/50 border border-border/30" : "border border-transparent hover:bg-muted/20"
      )}
    >
      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: `${p.color}22`, color: p.color }}>
        {p.icon || p.name.charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium truncate">
          {p.name}
          {isDefault && <span className="ml-1.5 text-nano px-1.5 py-0.5 rounded-full bg-primary/10 text-primary align-middle">default</span>}
        </span>
        {p.description && <span className="block text-micro text-muted-foreground/60 truncate">{p.description}</span>}
      </span>
      <span className="flex items-center gap-0.5 shrink-0">
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => toggleFavorite(p.id, e)}
          onKeyDown={(e) => { if (e.key === "Enter") toggleFavorite(p.id, e as unknown as React.MouseEvent); }}
          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-amber-500"
          aria-label={favorites.includes(p.id) ? "Remove favorite" : "Add favorite"}
        >
          <Star className={cn("w-3.5 h-3.5", favorites.includes(p.id) && "text-amber-500 fill-amber-500")} />
        </span>
        {onEdit && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onEdit(p.id); }}
            onKeyDown={(e) => { if (e.key === "Enter") onEdit(p.id); }}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-foreground"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil className="w-3 h-3" />
          </span>
        )}
      </span>
    </button>
  );

  return (
    <PickerSurface label="Personas" onClose={onClose} className={cn("w-72 bottom-full left-0 mb-1.5", className)}>
      {favoritePersonas.length > 0 && (
        <div className="mb-1.5">
          <p className="text-nano font-medium uppercase tracking-wider text-muted-foreground/40 px-2.5 py-1">Favorites</p>
          {favoritePersonas.map((p) => renderRow(p, p.id === defaultPersonaId))}
        </div>
      )}
      {recentPersonas.length > 0 && (
        <div className="mb-1.5">
          <p className="text-nano font-medium uppercase tracking-wider text-muted-foreground/40 px-2.5 py-1">Recent</p>
          {recentPersonas.map((p) => renderRow(p, p.id === defaultPersonaId))}
        </div>
      )}
      {others.length > 0 && (
        <div>
          <p className="text-nano font-medium uppercase tracking-wider text-muted-foreground/40 px-2.5 py-1">All</p>
          {others.map((p) => renderRow(p, p.id === defaultPersonaId))}
        </div>
      )}
      {personas.length === 0 && (
        <p className="px-2.5 py-3 text-tiny text-muted-foreground/50 flex items-center gap-2">
          <User className="w-3.5 h-3.5" /> No personas yet
        </p>
      )}
    </PickerSurface>
  );
}
