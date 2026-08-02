"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Shared modal primitive (Phase 8.16 — P1-1).
 *
 * One Radix Dialog-based overlay for every centered dialog in the app. Inherits
 * focus trap, Escape-to-close, and aria-modal from Radix, so hand-rolled
 * `fixed inset-0` overlays (PromptEditor, PromptRunDialog, HistoryDialog) no
 * longer diverge in backdrop, radius, padding, or focus behavior.
 *
 * Usage:
 *   <Modal open={open} onOpenChange={setOpen} title="...">
 *     ...children...
 *   </Modal>
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("rounded-2xl border-border/40 bg-background p-6 shadow-premium", contentClassName)}>
        <DialogHeader className={cn("text-left", className)}>
          <DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
