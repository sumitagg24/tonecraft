"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Target, Palette, Sparkles, CheckCircle, Send, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    id: "intent",
    label: "Intent",
    description: "Understanding what you want to say",
    icon: Target,
    detail: "Parses your raw message to extract core meaning, audience, and desired outcome.",
    color: "#6366f1",
  },
  {
    id: "tone",
    label: "Tone Analysis",
    description: "Detecting emotional undertones",
    icon: Palette,
    detail: "Identifies the current tone and maps it to your selected target tone profile.",
    color: "#a855f7",
  },
  {
    id: "generation",
    label: "Generation",
    description: "Crafting the first draft",
    icon: Sparkles,
    detail: "Generates an initial version using your chosen AI model and tone settings.",
    color: "#f97316",
  },
  {
    id: "refinement",
    label: "Refinement",
    description: "Polishing for platform & style",
    icon: CheckCircle,
    detail: "Applies platform-specific rules, grammar checks, and style guidelines.",
    color: "#10b981",
  },
  {
    id: "output",
    label: "Output",
    description: "Delivering the final message",
    icon: Send,
    detail: "Returns the platform-optimized message ready for you to review and send.",
    color: "#3b82f6",
  },
];

export function AIWorkflowSection() {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const advanceStage = useCallback(() => {
    setActiveStage((prev) => {
      if (prev >= STAGES.length - 1) {
        setIsPlaying(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(advanceStage, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, advanceStage]);

  const current = STAGES[activeStage];
  const Icon = current.icon;

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            AI Pipeline
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            How ToneCraft thinks
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every message passes through five intelligent stages. No black box — complete transparency.
          </p>
        </motion.div>

        <div className="flex items-stretch justify-center gap-2 md:gap-4 mb-12">
          {STAGES.map((stage, i) => {
            const StageIcon = stage.icon;
            const isActive = i === activeStage;
            const isComplete = i < activeStage;

            return (
              <button
                key={stage.id}
                onClick={() => { setActiveStage(i); setIsPlaying(false); }}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl transition-all duration-300 flex-1 min-w-0 group",
                  isActive
                    ? "glass-panel-strong"
                    : isComplete
                    ? "glass-panel opacity-70 hover:opacity-100"
                    : "glass-panel opacity-50 hover:opacity-70"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                    isActive && "scale-110"
                  )}
                  style={{
                    backgroundColor: isActive || isComplete ? `${stage.color}20` : "transparent",
                    border: `1px solid ${isActive || isComplete ? stage.color : "transparent"}`,
                  }}
                >
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5" style={{ color: stage.color }} />
                  ) : (
                    <StageIcon className="w-5 h-5" style={{ color: isActive ? stage.color : undefined }} />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center truncate w-full transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-panel-strong rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${current.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: current.color }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{current.label}</h3>
                <p className="text-sm text-muted-foreground">{current.description}</p>
              </div>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              {current.detail}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {STAGES.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        i <= activeStage ? "opacity-100" : "opacity-20"
                      )}
                      style={i <= activeStage ? { backgroundColor: STAGES[i].color } : {}}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Step {activeStage + 1} of {STAGES.length}
                </span>
              </div>

              <button
                onClick={() => {
                  if (isPlaying) {
                    setIsPlaying(false);
                  } else if (activeStage >= STAGES.length - 1) {
                    setActiveStage(0);
                    setIsPlaying(true);
                  } else {
                    advanceStage();
                    setIsPlaying(true);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Playing...
                  </>
                ) : activeStage >= STAGES.length - 1 ? (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    Replay
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    Next Step
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
