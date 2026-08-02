"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Sparkles, TrendingUp } from "lucide-react";

const workflowSteps = [
  {
    label: "Input",
    description: "Type your raw message, idea, or rough draft",
    icon: <Sparkles className="w-5 h-5" />,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  {
    label: "AI Processing",
    description: "ToneCraft analyzes tone, context, and platform requirements",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.1)",
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  {
    label: "Professional Output",
    description: "Receive a polished, platform-optimized message instantly",
    icon: <Play className="w-5 h-5" />,
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
];

export function Capabilities() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 aurora-bg opacity-30 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            How It Works
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            From raw idea to polished message
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three steps. Every message, every time. ToneCraft handles the rest.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:shadow-lg"
                style={{
                  backgroundColor: step.bgColor,
                  border: `1px solid ${step.borderColor}`,
                  boxShadow: `0 0 20px ${step.color}15`,
                }}
              >
                <div style={{ color: step.color }}>{step.icon}</div>
              </motion.div>

              <h3 className="text-lg font-semibold mb-2">{step.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>

              {i < workflowSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={inView ? { opacity: 1, scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.2 + 0.4 }}
                  className="hidden md:block absolute h-0.5 bg-gradient-to-r from-primary/40 to-transparent w-full max-w-[120px]"
                  style={{ top: "4rem", right: "-6rem" }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="glass-panel-strong rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text-animated stat-number">
                  Early Access
                </div>
                <p className="text-sm text-muted-foreground mt-1">Join waitlist — launch Q3</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text-animated stat-number">
                  Coming Soon
                </div>
                <p className="text-sm text-muted-foreground mt-1">Real-time analytics dashboard</p>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text-animated stat-number">
                  &lt;2s
                </div>
                <p className="text-sm text-muted-foreground mt-1">Average response time</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}