"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Share2, Send, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/styles/motion";

interface ShareItem {
  icon: typeof Link2;
  label: string;
}

interface SocialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  items?: ShareItem[];
  onShare?: (index: number, item: ShareItem) => void;
  className?: string;
}

const DEFAULT_SHARE_ITEMS: ShareItem[] = [
  { icon: Share2, label: "Share on Twitter" },
  { icon: Send, label: "Share on Instagram" },
  { icon: Globe, label: "Share on LinkedIn" },
  { icon: Link2, label: "Copy link" },
];

/**
 * Tap/dropdown share menu — works on touch devices where hover-based
 * expanders (the old implementation) never open. Clicking the trigger opens
 * a compact menu with all share targets; on desktop, hovering also opens it.
 */
export default function SocialButton({
  label = "Share",
  items = DEFAULT_SHARE_ITEMS,
  onShare,
  className,
  ...props
}: SocialButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Hover-to-open is desktop-only: touch devices synthesize mouseenter on tap,
  // which can race with the tap toggle and leave the menu in a half-open state.
  const [canHover] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );

  // Close on outside pointer-down or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleShare = (index: number) => {
    const item = items[index];
    setOpen(false);
    setActiveIndex(index);
    onShare?.(index, item);
    setTimeout(() => setActiveIndex(null), 300);
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={canHover ? () => setOpen(true) : undefined}
      onMouseLeave={canHover ? () => setOpen(false) : undefined}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // Always open on click (never toggle): on touch, a tap fires a
        // synthesized mouseenter (opens) right before click — toggling would
        // close the menu on the first tap. The fixed backdrop handles closing.
        onClick={() => setOpen(true)}
        className={cn(
          "h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted/30",
          open && "bg-muted/40 text-foreground",
          className
        )}
        {...props}
      >
        <Share2 className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: ease.default }}
              // pt-1.5 is a transparent bridge so desktop hover is continuous
              // across the visual gap (no onMouseLeave while moving to the menu).
              className="absolute right-0 top-full z-50 w-52 pt-1.5"
            >
              <div className="rounded-xl border border-border/40 bg-popover shadow-premium p-1.5 backdrop-blur-xl">
              {items.map((item, i) => (
                <button
                  key={`share-${item.label}`}
                  role="menuitem"
                  type="button"
                  onClick={() => handleShare(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors min-h-9",
                    activeIndex === i && "bg-muted/30 text-foreground"
                  )}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </span>
                  {item.label}
                </button>
              ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
