"use client";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check } from "lucide-react";

interface SyncBarProps {
  syncing: boolean;
  syncedCount: number;
}

export function SyncBar({ syncing, syncedCount }: SyncBarProps) {
  return (
    <AnimatePresence>
      {(syncing || syncedCount > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border/40 shadow-lg text-xs"
        >
          {syncing ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-muted-foreground">Syncing...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-muted-foreground">
                {syncedCount} item{syncedCount !== 1 ? "s" : ""} synced
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}