"use client";
import { motion } from "framer-motion";
import { Check, Circle, Rocket } from "lucide-react";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

const PHASES = [
  {
    phase: "Now",
    title: "Core communication",
    items: ["AI rewriting & tone control", "Platform-specific drafts", "Prompt library & personas", "Knowledge-grounded chat"],
    done: true,
  },
  {
    phase: "Next",
    title: "Team & productivity",
    items: ["Workspaces & collaboration", "Kanban, notes & calendar", "Voice & dictation", "Multi-language publishing"],
    done: false,
  },
  {
    phase: "Later",
    title: "Platform",
    items: ["AI Marketplace", "Agentic workflows & smart automation", "Memory & context graph", "Voice & multimodal input"],
    done: false,
  },
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-16"
        >
          <motion.div
            variants={sectionChip}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Rocket className="w-3.5 h-3.5" />
            Roadmap
          </motion.div>
          <motion.h2 variants={sectionItem} className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Where we&apos;re headed
          </motion.h2>
          <motion.p variants={sectionItem} className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            A clear path from a brilliant writing tool to a full communication platform.
          </motion.p>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {PHASES.map((phase) => (
            <motion.div
              key={phase.phase}
              variants={sectionItem}
              whileHover={{ y: -2 }}
              className="glass-panel rounded-2xl p-6 flex flex-col hover:border-border/70 hover:shadow-card transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                  {phase.phase}
                </span>
                {phase.done && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                    <Check className="w-3 h-3" /> Live
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base mb-3">{phase.title}</h3>
              <ul className="space-y-2.5 mt-auto">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <Circle className="w-1.5 h-1.5 mt-2 fill-current shrink-0 opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
