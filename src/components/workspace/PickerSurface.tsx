"use client";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/styles/motion";

interface PickerSurfaceProps {
  label: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export function PickerSurface({ label, onClose, className, children }: PickerSurfaceProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return createPortal(
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          onPointerDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={label}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border/40 bg-popover shadow-premium p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-muted-foreground/20" />
          <p className="text-micro font-medium uppercase tracking-wider text-muted-foreground/50 px-1.5 pb-1.5">
            {label}
          </p>
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin -mx-1 px-1">{children}</div>
        </motion.div>
      </>,
      document.body
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: duration.fast, ease: ease.default }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "absolute z-50 rounded-xl border border-border/40 bg-popover shadow-premium p-2 backdrop-blur-xl",
        className
      )}
    >
      <p className="text-micro font-medium uppercase tracking-wider text-muted-foreground/50 px-1.5 pb-1.5">
        {label}
      </p>
      {children}
    </motion.div>
  );
}
