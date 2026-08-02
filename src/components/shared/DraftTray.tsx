import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, MessageSquare, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftTrayProps {
  drafts: Array<{
    id: string;
    chatId: string | null;
    content: string;
    tone: string | null;
    updatedAt: string;
  }>;
  onOpen: (chatId: string | null) => void;
  onDelete: (id: string) => void;
}

export function DraftTray({ drafts, onOpen, onDelete }: DraftTrayProps) {
  const [open, setOpen] = useState(false);

  if (drafts.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-all"
      >
        <FileText className="w-3.5 h-3.5" />
        Drafts ({drafts.length})
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-full left-0 mb-1 w-72 rounded-xl border border-border/40 bg-popover shadow-premium overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-border/20">
              <span className="text-xs font-semibold">Saved Drafts</span>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {drafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => {
                    onOpen(draft.chatId);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/20 group"
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium truncate">
                      {draft.chatId ? `Chat draft` : "Scratchpad"}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/50 line-clamp-1">
                      {draft.content.slice(0, 60)}
                    </span>
                  </span>
                  <Clock className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(draft.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground/40" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}