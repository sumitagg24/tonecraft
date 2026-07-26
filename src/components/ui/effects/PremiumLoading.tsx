"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ai, loading, spring, duration, ease } from "@/styles/motion";
import { Sparkles, Bot } from "lucide-react";

export function AIOrb({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const reduced = useReducedMotion();
  const sizes = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-20 h-20" };
  const inner = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <motion.div
        animate={reduced ? {} : { scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-indigo-500/30 blur-xl"
      />
      <motion.div
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-1 rounded-full border-2 border-violet-500/20 border-t-violet-500/60"
      />
      <motion.div
        animate={reduced ? {} : { rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 rounded-full border border-indigo-500/15 border-b-indigo-500/40"
      />
      <motion.div
        animate={reduced ? {} : { scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={cn("rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow", inner[size])}
      >
        <Sparkles className={cn("text-white", size === "lg" ? "w-5 h-5" : size === "md" ? "w-3.5 h-3.5" : "w-2.5 h-2.5")} />
      </motion.div>
    </div>
  );
}

export function GradientLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-1 overflow-hidden rounded-full bg-muted/30", className)}>
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-500/60 via-purple-500/40 to-transparent"
      />
    </div>
  );
}

export function MorphingDots({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={reduced ? {} : {
            y: [0, -4, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
        />
      ))}
    </span>
  );
}

export function ThinkingGlyph({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className={cn("relative", className)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/60">
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 1 7.92 12.446a9 9 0 1 1-8.313-12.454z" />
        <path d="M12 3v2m0 14v2m-9-9h2m14 0h2" opacity="0.4" />
      </svg>
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 bg-primary/10 rounded-full blur-sm"
      />
    </motion.div>
  );
}

export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-muted/40", className)}>
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
      />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <SkeletonShimmer className="h-8 w-3/4" />
      <SkeletonShimmer className="h-10 w-full" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <SkeletonShimmer className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <SkeletonShimmer className="h-3 w-full" />
            <SkeletonShimmer className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContextLoading() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonShimmer className="h-5 w-1/2" />
      <SkeletonShimmer className="h-24 w-full rounded-2xl" />
      <SkeletonShimmer className="h-20 w-full rounded-2xl" />
      <SkeletonShimmer className="h-16 w-3/4 rounded-2xl" />
    </div>
  );
}

export function PromptLoading() {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3.5 rounded-xl border border-border/20">
          <SkeletonShimmer className="h-8 w-8 rounded-lg mb-3" />
          <SkeletonShimmer className="h-3 w-3/4 mb-2" />
          <SkeletonShimmer className="h-2 w-full mb-1" />
          <SkeletonShimmer className="h-2 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function StreamingCursor({ className }: { className?: string }) {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.5, repeat: Infinity }}
      className={cn("inline-block w-[2px] h-[1em] bg-primary align-text-bottom ml-0.5", className)}
    />
  );
}

export function AnimatedLogo({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.03, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className={cn("flex items-center gap-2", className)}
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <span className="font-bold text-lg tracking-tight gradient-text">ToneCraft</span>
    </motion.div>
  );
}
