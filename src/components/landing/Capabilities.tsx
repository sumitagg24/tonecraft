"use client";
import { motion } from "framer-motion";
import {
  MessageSquare, Music2, Languages, Zap, CheckCircle2, Layers,
} from "lucide-react";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

const features = [
  {
    icon: MessageSquare,
    title: "Platform-perfect, every time",
    description: "Rewrites follow the conventions of Email, LinkedIn, Slack, WhatsApp and 8+ platforms.",
  },
  {
    icon: Music2,
    title: "Tones that match you",
    description: "Ten built-in voices — or create custom personas that sound exactly like you.",
  },
  {
    icon: Languages,
    title: "50+ languages",
    description: "Write once, speak globally. Your tone carries across every language.",
  },
  {
    icon: Zap,
    title: "One-click transform",
    description: "Any draft becomes the right version for the right audience, instantly.",
  },
  {
    icon: CheckCircle2,
    title: "Grammar & style",
    description: "Cleaner, sharper writing — as a side effect of every single rewrite.",
  },
  {
    icon: Layers,
    title: "Templates & prompts",
    description: "Start from proven structures for emails, pitches, posts and more.",
  },
];

export function Capabilities() {
  return (
    <section id="features" className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
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
            Core capabilities
          </motion.div>
          <motion.h2 variants={sectionItem} className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Everything you need to communicate better
          </motion.h2>
          <motion.p variants={sectionItem} className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            ToneCraft handles the details, so you can focus on what to say.
          </motion.p>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={sectionItem}
              whileHover={{ y: -2 }}
              className="group glass-panel rounded-2xl p-6 hover:border-border/70 hover:shadow-card transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
