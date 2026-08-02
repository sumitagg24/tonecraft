import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RotateCcw, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        onClick={onClose}
      >
        <motion.div
          className="bg-background rounded-xl border border-border/40 shadow-xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-sm font-semibold">Version History</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

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
                      <span className="block text-[10px] text-muted-foreground/50">
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}