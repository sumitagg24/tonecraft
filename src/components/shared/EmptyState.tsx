"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, duration } from "@/styles/motion";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal }}
      className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}
    >
      {Icon && (
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border/30 flex items-center justify-center">
            <Icon className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-xl" />
        </div>
      )}
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}
