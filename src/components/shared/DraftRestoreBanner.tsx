import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftRestoreBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreBanner({ onRestore, onDiscard }: DraftRestoreBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20 text-sm"
      >
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 text-xs text-foreground/80">
          You have a saved draft for this chat.
        </span>
        <Button variant="ghost" size="sm" onClick={onRestore} className="h-7 text-xs">
          <RotateCcw className="w-3 h-3 mr-1" />
          Restore
        </Button>
        <Button variant="ghost" size="sm" onClick={onDiscard} className="h-7 text-xs text-muted-foreground">
          <Trash2 className="w-3 h-3 mr-1" />
          Discard
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="h-7 w-7 p-0">
          <X className="w-3 h-3" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}