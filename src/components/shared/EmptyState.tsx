"use client";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, duration } from "@/styles/motion";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** "error" renders a failed-to-load state with a retry action instead of "empty". */
  variant?: "default" | "error";
  onRetry?: () => void;
}

export function EmptyState({
  icon: Icon, title, description, action, className, variant = "default", onRetry,
}: EmptyStateProps) {
  const isError = variant === "error";
  const IconComponent = (isError ? AlertTriangle : Icon) ?? AlertTriangle;
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal }}
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      {IconComponent && (
        <div className="relative mb-6">
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center",
            isError && "border-destructive/30 bg-destructive/5"
          )}>
            <IconComponent className={cn("w-7 h-7 text-muted-foreground/40", isError && "text-destructive/70")} />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-xl" />
        </div>
      )}
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      )}
      {action ?? (isError && onRetry ? (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium border border-border/30 text-foreground/80 hover:bg-muted/30 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      ) : null)}
    </motion.div>
  );
}
