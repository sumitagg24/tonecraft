"use client";
import { motion } from "framer-motion";
import { Check, X, Bot, Palette, Globe, Zap, Shield, Layers, Sparkles } from "lucide-react";

const COMPARISONS = [
  {
    category: "Purpose",
    traditional: "General-purpose chat AI",
    tonecraft: "Specialized communication platform",
    icon: Bot,
  },
  {
    category: "Tone Control",
    traditional: "Requires manual prompt engineering",
    tonecraft: "9+ presets + custom personas in one click",
    icon: Palette,
  },
  {
    category: "Platform Adaptation",
    traditional: "Generic text output",
    tonecraft: "Auto-adapts to WhatsApp, LinkedIn, Email, Slack, and more",
    icon: Globe,
  },
  {
    category: "Speed",
    traditional: "Variable — depends on model load",
    tonecraft: "Optimized via Groq — responses in under 2 seconds",
    icon: Zap,
  },
  {
    category: "Context",
    traditional: "Forgets between conversations",
    tonecraft: "Persistent context panel with full history",
    icon: Layers,
  },
  {
    category: "Reliability",
    traditional: "No built-in safeguards",
    tonecraft: "Grammar check, style validation, platform rules enforced",
    icon: Shield,
  },
];

export function WhyToneCraftComparison() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Why ToneCraft
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Not just another AI chat
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ToneCraft is purpose-built for communication. While general AI chats require
            constant prompt engineering, ToneCraft handles the nuance automatically.
          </p>
        </motion.div>

        <div className="space-y-3">
          {COMPARISONS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group"
              >
                <div className="glass-panel rounded-2xl p-4 md:p-5 transition-all duration-200 hover:border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="hidden md:flex w-10 h-10 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                          <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-red-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">Generic AI</span>
                            <p className="text-sm text-muted-foreground mt-0.5">{item.traditional}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">ToneCraft</span>
                            <p className="text-sm text-foreground/90 mt-0.5">{item.tonecraft}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
