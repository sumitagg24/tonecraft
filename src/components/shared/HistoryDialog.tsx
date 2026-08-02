import { useState } from "react";
import { Clock, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/Modal";

interface Version {
  id: string;
  content: string;
  source: string;
  createdAt: string;
}

interface HistoryDialogProps {
  versions: Version[];
  onRestore: (content: string) => void;
  onClose: () => void;
}

export function HistoryDialog({ versions, onRestore, onClose }: HistoryDialogProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title="Version History">
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No version history yet
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id}>
                  <button
                    onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-medium">
                        {v.source === "autosave" ? "Autosave" : v.source === "manual" ? "Manual save" : "Restore"}
                      </span>
                      <span className="block text-micro text-muted-foreground/50">
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {expanded === v.id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </button>

                  {expanded === v.id && (
                    <div className="px-4 pb-3 ml-7">
                      <pre className="text-xs text-muted-foreground/70 bg-muted/20 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                        {v.content.slice(0, 500)}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => onRestore(v.content)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore this version
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
      </div>
    </Modal>
  );
}