"use client";
import { toast } from "sonner";
import { Check, X, AlertTriangle, Info, Wand2, Copy, Bookmark, Trash2 } from "lucide-react";
import type { ReactElement } from "react";

function PremiumToastContent({
  iconEl, iconColor, message, description, action, onDismiss,
}: {
  iconEl: ReactElement; iconColor: string; message: string; description?: string;
  action?: { label: string; onClick: () => void }; onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className={`mt-0.5 ${iconColor}`}>
        {iconEl}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label}
          </button>
        )}
        <button onClick={onDismiss} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function usePremiumToast() {
  return {
    success: (message: string, description?: string) =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<Check className="w-4 h-4" />} iconColor="text-green-500" message={message} description={description} onDismiss={() => toast.dismiss(t)} />
      )),

    error: (message: string, description?: string) =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<X className="w-4 h-4" />} iconColor="text-red-500" message={message} description={description} onDismiss={() => toast.dismiss(t)} />
      )),

    warning: (message: string, description?: string) =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<AlertTriangle className="w-4 h-4" />} iconColor="text-amber-500" message={message} description={description} onDismiss={() => toast.dismiss(t)} />
      )),

    info: (message: string, description?: string) =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<Info className="w-4 h-4" />} iconColor="text-blue-500" message={message} description={description} onDismiss={() => toast.dismiss(t)} />
      )),

    copied: () =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<Copy className="w-4 h-4" />} iconColor="text-primary" message="Copied to clipboard" onDismiss={() => toast.dismiss(t)} />
      ), { duration: 2000 }),

    bookmarked: (undo?: () => void) =>
      toast.custom((t) => (
        <PremiumToastContent
          iconEl={<Bookmark className="w-4 h-4" />} iconColor="text-amber-500" message="Bookmarked"
          action={undo ? { label: "Undo", onClick: () => { undo(); toast.dismiss(t); } } : undefined}
          onDismiss={() => toast.dismiss(t)}
        />
      ), { duration: 3000 }),

    deleted: (undo?: () => void) =>
      toast.custom((t) => (
        <PremiumToastContent
          iconEl={<Trash2 className="w-4 h-4" />} iconColor="text-red-500" message="Deleted"
          action={undo ? { label: "Undo", onClick: () => { undo(); toast.dismiss(t); } } : undefined}
          onDismiss={() => toast.dismiss(t)}
        />
      ), { duration: 3000 }),

    upgrade: () =>
      toast.custom((t) => (
        <PremiumToastContent iconEl={<Wand2 className="w-4 h-4" />} iconColor="text-brand" message="Upgrade available" description="Unlock premium features" onDismiss={() => toast.dismiss(t)} />
      ), { duration: 4000 }),
  };
}
