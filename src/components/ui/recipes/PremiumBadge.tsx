"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/styles/motion";
import { recipe } from "@/styles/recipes";

interface PremiumBadgeProps {
  variant?: "tone" | "glass" | "default";
  dot?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumBadge({ className, variant = "default", dot, children }: PremiumBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.gentle}
      className={cn(
        recipe.badge.base,
        variant === "tone" && recipe.badge.tone,
        variant === "glass" && recipe.badge.glass,
        className
      )}
    >
      {dot && <span className={cn(recipe.badge.dot, dot)} />}
      {children}
    </motion.span>
  );
}
