"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PickerSurface } from "./PickerSurface";
import { cn } from "@/lib/utils";
import { FileText, Search, Loader2, Check, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import type { KnowledgeFileItem } from "./KnowledgeLibraryPage";

export function KnowledgePicker({
  selected,
  onChange,
  onClose,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<KnowledgeFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<{ files: KnowledgeFileItem[] }>("/api/knowledge")
      .then((data) => {
        if (cancelled) return;
        setFiles((data.files ?? []).filter((f) => f.status === "ready" || f.status === "indexed"));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(
    (id: string) => {
      onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    },
    [selected, onChange]
  );

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(q) || f.fileName.toLowerCase().includes(q));
  }, [files, search]);

  return (
    <PickerSurface label="Ground with knowledge" onClose={onClose} className="w-80 bottom-full left-0 mb-2 shadow-lg border border-border/40">
      <p className="text-xs text-muted-foreground px-3 pb-2">
        Selected reference documents ground AI responses with exact citations.
      </p>

      {/* Quick Search */}
      <div className="relative px-2 mb-2">
        <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter documents..."
          className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-input bg-background/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-label="Filter attached knowledge documents"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6" role="status" aria-label="Loading knowledge files">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          <FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground/40" />
          <p className="font-medium">No documents ready</p>
          <p className="text-muted-foreground/60 mt-0.5">Upload files in the Knowledge tab to use them here.</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground/60 text-center">No documents match &quot;{search}&quot;</p>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-1 px-1 scrollbar-thin">
          {filteredFiles.map((f) => {
            const active = selected.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all border",
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
                aria-label={`Attach ${f.name} to conversation`}
                aria-pressed={active}
              >
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{f.fileName}</p>
                </div>
                {active ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </PickerSurface>
  );
}
