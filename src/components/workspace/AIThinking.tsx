"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ai, loading, spring, duration, ease, fadeInUp } from "@/styles/motion";
import { Sparkles, Bot } from "lucide-react";

const thinkingPhases = [
  { label: "Thinking", icon: "brain" },
  { label: "Crafting", icon: "sparkles" },
  { label: "Refining", icon: "stars" },
  { label: "Polishing", icon: "gem" },
];

export function AIThinking({ phase = 0, isStreaming = false }: { phase?: number; isStreaming?: boolean }) {
  const current = thinkingPhases[phase % thinkingPhases.length];

  return (
    <div className="flex items-start gap-3 px-6 py-5 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={spring.elastic}
        className="relative shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <motion.div
          {...ai.thinking}
          className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 blur-md"
        />
      </motion.div>

      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-center gap-2 mb-2">
          <motion.span
            key={current.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.fast }}
            className="text-sm font-medium text-foreground/80"
          >
            {current.label}
          </motion.span>
          <AnimatedDots />
        </div>

        <div className="h-16 relative overflow-hidden">
          <StreamingWave />
        </div>
      </div>
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          className="w-1 h-1 rounded-full bg-primary/60"
        />
      ))}
    </span>
  );
}

function StreamingWave() {
  return (
    <div className="flex items-end gap-0.5 h-full">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: [4, 8, 4, 12, 4, 8, 4],
            opacity: [0.2, 0.5, 0.2, 0.7, 0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
          className="w-1 rounded-full bg-gradient-to-t from-violet-500/60 to-indigo-500/30"
          style={{ height: 4 + Math.random() * 12 }}
        />
      ))}
    </div>
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
        <Sparkles className="w-3.5 h-3.5" />
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
      className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mt-2"
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
    <div className="relative w-full h-1 overflow-hidden rounded-full bg-muted/30">
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
      />
    </div>
  );
}
