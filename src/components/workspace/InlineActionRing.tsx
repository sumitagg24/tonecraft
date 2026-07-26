"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring, duration, ease, fadeInScale, MotionPresets } from "@/styles/motion";
import {
  Sparkles, Briefcase, Smile, Zap, Building2, Heart,
  Globe, CheckSquare, FileText, Copy, Mail,
  Camera, MessageCircle, Reply, Laugh, AlignLeft,
} from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/icons/social-icons";

interface ActionRingAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: (text: string) => void;
}

export function InlineActionRing({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length > 500) {
        setSelection(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const container = containerRef.current;
      if (container && !container.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }

      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 12,
      });
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
    };
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const actions: ActionRingAction[] = [
    { id: "rewrite", label: "Rewrite", icon: Sparkles, color: "#a855f7", action: (text) => handleAction("Rewrite this:", text) },
    { id: "professional", label: "Professional", icon: Briefcase, color: "#3b82f6", action: (text) => handleAction("Make this professional:", text) },
    { id: "casual", label: "Casual", icon: Smile, color: "#10b981", action: (text) => handleAction("Make this casual:", text) },
    { id: "genz", label: "Gen Z", icon: Zap, color: "#a855f7", action: (text) => handleAction("Make this Gen Z:", text) },
    { id: "corporate", label: "Corporate", icon: Building2, color: "#6366f1", action: (text) => handleAction("Make this corporate:", text) },
    { id: "funny", label: "Funny", icon: Laugh, color: "#f97316", action: (text) => handleAction("Make this funny:", text) },
    { id: "translate", label: "Translate", icon: Globe, color: "#14b8a6", action: (text) => handleAction("Translate this:", text) },
    { id: "grammar", label: "Grammar", icon: CheckSquare, color: "#f97316", action: (text) => handleAction("Fix grammar:", text) },
    { id: "summarize", label: "Summarize", icon: FileText, color: "#a855f7", action: (text) => handleAction("Summarize this:", text) },
    { id: "copy", label: "Copy", icon: Copy, color: "#e4e4e7", action: (text) => navigator.clipboard.writeText(text) },
    { id: "email", label: "Email", icon: Mail, color: "#EA4335", action: (text) => handleAction("Turn this into an email:", text) },
    { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon, color: "#0A66C2", action: (text) => handleAction("Turn this into a LinkedIn post:", text) },
    { id: "tweet", label: "Twitter", icon: TwitterIcon, color: "#1DA1F2", action: (text) => handleAction("Turn this into a tweet:", text) },
    { id: "instagram", label: "Instagram", icon: Camera, color: "#E4405F", action: (text) => handleAction("Turn this into an Instagram caption:", text) },
    { id: "reply", label: "Reply", icon: Reply, color: "#10b981", action: (text) => handleAction("Write a reply to:", text) },
  ];

  const handleAction = (prefix: string, text: string) => {
    const textarea = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.value = `${prefix} "${text}"`;
      textarea.focus();
      const event = new Event("input", { bubbles: true });
      textarea.dispatchEvent(event);
    }
    clearSelection();
  };

  return (
    <AnimatePresence>
      {selection && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            onClick={clearSelection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ringRef}
            variants={MotionPresets.QuickAction}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={spring.gentle}
            className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-2xl bg-popover border border-border/30 shadow-premium backdrop-blur-2xl"
            style={{
              left: selection.x,
              top: selection.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="flex items-center gap-0.5">
              {actions.slice(0, 7).map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => { e.stopPropagation(); action.action(selection.text); }}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-all group relative"
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-border/20 mx-0.5" />
            <div className="flex items-center gap-0.5">
              {actions.slice(7, 15).map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => { e.stopPropagation(); action.action(selection.text); }}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-all group relative"
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
