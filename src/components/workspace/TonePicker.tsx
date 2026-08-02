"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { TONES } from "@/lib/constants";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";
import { PickerSurface } from "./PickerSurface";

const FAVORITES_KEY = "tc:tone-favorites";
const RECENT_KEY = "tc:tone-recent";
const MAX_RECENT = 4;

interface TonePickerProps {
  onSelect?: (id: string) => void;
  onClose: () => void;
}

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function TonePicker({ onSelect, onClose }: TonePickerProps) {
  const selectedTone = useChatStore((s) => s.selectedTone);
  const setSelectedTone = useChatStore((s) => s.setSelectedTone);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => readList(FAVORITES_KEY));
  const [recent, setRecent] = useState<string[]>(() => readList(RECENT_KEY));

  const preview = TONES.find((t) => t.id === (previewId ?? selectedTone)) ?? TONES[0];
  const favTones = favorites.map((id) => TONES.find((t) => t.id === id)).filter((t): t is (typeof TONES)[number] => Boolean(t));
  const recentTones = recent
    .map((id) => TONES.find((t) => t.id === id))
    .filter((t): t is (typeof TONES)[number] => Boolean(t))
    .filter((t) => !favorites.includes(t.id));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev.filter((x) => x !== id)];
      writeList(FAVORITES_KEY, next);
      return next;
    });
  };

  const pick = (id: string) => {
    setSelectedTone(id);
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      writeList(RECENT_KEY, next);
      return next;
    });
    onSelect?.(id);
  };

  const toneRow = (tone: (typeof TONES)[number]) => {
    const active = selectedTone === tone.id;
    const isFav = favorites.includes(tone.id);
    return (
      <div
        key={tone.id}
        onMouseEnter={() => setPreviewId(tone.id)}
        onFocus={() => setPreviewId(tone.id)}
        className={cn(
          "group flex items-center gap-1 rounded-lg border p-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/30",
          active ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-muted/30"
        )}
      >
        <button
          onClick={() => pick(tone.id)}
          className="flex flex-1 items-center gap-2 min-w-0 text-left"
          aria-label={`Select ${tone.label} tone`}
        >
          <span className="text-base leading-none shrink-0">{tone.emoji}</span>
          <span className="text-xs font-medium truncate">{tone.label}</span>
        </button>
        <button
          onClick={() => toggleFavorite(tone.id)}
          aria-label={isFav ? `Remove ${tone.label} from favorites` : `Add ${tone.label} to favorites`}
          className={cn(
            "shrink-0 rounded-md p-1 transition-colors",
            isFav ? "text-amber-400" : "text-muted-foreground/30 hover:text-muted-foreground"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
        </button>
      </div>
    );
  };

  return (
    <PickerSurface label="Tone" onClose={onClose} className="w-[300px] bottom-full left-0 mb-1.5">
      {/* Preview */}
      <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5 mb-2" aria-live="polite">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg leading-none">{preview.emoji}</span>
          <span className="text-xs font-semibold" style={{ color: preview.color }}>{preview.label}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground italic">{preview.example}</p>
      </div>

      {/* Favorites */}
      {favTones.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 px-1.5 pb-1">
            Favorites
          </p>
          <div className="grid grid-cols-2 gap-1">{favTones.map(toneRow)}</div>
        </div>
      )}

      {/* Recent */}
      {recentTones.length > 0 && (
        <div className="mb-1.5">
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 px-1.5 pb-1">
            Recent
          </p>
          <div className="flex flex-wrap gap-1 px-1">
            {recentTones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => pick(tone.id)}
                className="flex items-center gap-1 rounded-full border border-border/30 bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
              >
                <span className="text-xs leading-none">{tone.emoji}</span>
                {tone.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All tones */}
      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 px-1.5 pb-1 pt-0.5">
        All tones
      </p>
      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto scrollbar-thin pr-0.5">
        {TONES.filter((t) => !favorites.includes(t.id)).map(toneRow)}
      </div>
    </PickerSurface>
  );
}
