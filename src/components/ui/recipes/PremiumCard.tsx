"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionPresets, cardTransition, hoverLift } from "@/styles/motion";
import { glassCard } from "@/styles/recipes";
import { useReducedMotion, useSafeTransition } from "@/hooks/use-reduced-motion";

interface PremiumCardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  glow?: boolean;
}

export function PremiumCard({ className, interactive, glow, children, ...props }: PremiumCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={MotionPresets.CardEntrance}
      initial="initial"
      animate="animate"
      transition={useSafeTransition(cardTransition)}
      whileHover={interactive && !reduced ? hoverLift.card.whileHover : undefined}
      className={cn(glassCard(), glow && "shadow-glow border-primary/20", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
