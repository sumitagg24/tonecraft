"use client";
import { motion } from "framer-motion";
import { spring, duration } from "@/styles/motion";
import { Feather } from "lucide-react";

const thinkingPhases = [
  { label: "Thinking" },
  { label: "Crafting" },
  { label: "Refining" },
  { label: "Polishing" },
];

export function AIThinking({ phase = 0 }: { phase?: number }) {
  const current = thinkingPhases[phase % thinkingPhases.length];

  return (
    <div className="flex items-start gap-3 px-6 py-4 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.elastic}
        className="relative shrink-0"
      >
        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
          <Feather className="w-3.5 h-3.5 text-white" />
        </div>
      </motion.div>

      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2.5 mb-2">
          <motion.span
            key={current.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.fast }}
            className="text-[13px] font-medium text-foreground/70"
          >
            {current.label}
          </motion.span>
          <AnimatedDots />
        </div>

        {/* Quiet shimmer line */}
        <div className="relative h-px w-full overflow-hidden bg-border/20">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -2, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          className="w-1 h-1 rounded-full bg-primary/50"
        />
      ))}
    </span>
  );
}

export function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity }}
      className="inline-block w-[2px] h-[1em] bg-primary align-text-bottom ml-0.5"
    />
  );
}

export function ResponseIncoming() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 px-6 py-3 text-xs text-muted-foreground/70"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Feather className="w-3.5 h-3.5" />
      </motion.div>
      <span>Response incoming...</span>
    </motion.div>
  );
}

export function GenerationComplete() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={spring.snappy}
      className="flex items-center gap-1.5 text-micro text-muted-foreground/50 mt-2"
    >
      <motion.div
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <span>Generated</span>
    </motion.div>
  );
}

export function GradientPulse() {
  return (
    <div className="relative w-full h-px overflow-hidden rounded-full bg-border/20">
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-brand/40 to-transparent"
      />
    </div>
  );
}
