"use client";
import { useEffect, useState, useCallback } from "react";
import { PickerSurface } from "./PickerSurface";
import { cn } from "@/lib/utils";
import { FileText, Loader2 } from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;
    api<{ files: KnowledgeFileItem[] }>("/api/knowledge")
      .then((data) => {
        if (cancelled) return;
        setFiles((data.files ?? []).filter((f) => f.status === "ready"));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }, [selected, onChange]);

  return (
    <PickerSurface label="Ground with knowledge" onClose={onClose} className="w-72 bottom-full left-0 mb-1.5">
      <p className="text-micro text-muted-foreground/50 px-2.5 pb-1.5">
        Selected files guide this response with citations.
      </p>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <p className="px-2.5 py-3 text-tiny text-muted-foreground/50 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> No documents indexed yet. Add files in the Knowledge tab.
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto scrollbar-thin">
          {files.map((f) => {
            const active = selected.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                  active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                )}
              >
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-3 h-3" />
                </span>
                <span className="flex-1 truncate">{f.name}</span>
                {active && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </PickerSurface>
  );
}
