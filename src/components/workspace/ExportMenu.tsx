"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "md", label: "Markdown (.md)", mime: "text/markdown" },
  { id: "txt", label: "Plain text (.txt)", mime: "text/plain" },
  { id: "html", label: "HTML (.html)", mime: "text/html" },
  { id: "json", label: "JSON (.json)", mime: "application/json" },
];

export function ExportMenu({
  chatId,
  align = "left",
}: {
  chatId: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const exportChat = useCallback(async (format: string, mime: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, format }),
      });
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const blob = new Blob([data.content], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
      toast.success("Exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setBusy(false);
    }
  }, [chatId]);

  const shareChat = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      await navigator.clipboard.writeText(data.url).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
      toast.success("Share link copied to clipboard");
    } catch {
      toast.error("Share failed");
    } finally {
      setBusy(false);
    }
  }, [chatId]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
          open ? "bg-muted/40 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
        )}
        aria-label="Export chat"
        aria-expanded={open}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "absolute z-50 mt-1.5 w-52 rounded-xl border border-border/40 bg-popover shadow-premium p-1.5",
                align === "right" ? "right-0" : "left-0"
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 px-2 py-1">
                Export chat
              </p>
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => exportChat(f.id, f.mime)}
                  disabled={busy}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              ))}
              <div className="my-1.5 border-t border-border/30" />
              <button
                onClick={shareChat}
                disabled={busy}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Link copied!" : "Share read-only link"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
