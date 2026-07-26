"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionPresets, duration, ease } from "@/styles/motion";
import { panelRecipe } from "@/styles/recipes";

interface PremiumPanelProps extends HTMLMotionProps<"div"> {
  elevated?: boolean;
}

export function PremiumPanel({ className, elevated, children, ...props }: PremiumPanelProps) {
  return (
    <motion.div
      variants={MotionPresets.FloatingPanel}
      initial="initial"
      animate="animate"
      transition={{ duration: duration.normal, ease: ease.default }}
      className={cn(panelRecipe(), elevated && "shadow-premium", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
