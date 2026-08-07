"use client";
import { motion } from "framer-motion";
import { PencilLine, SlidersHorizontal, Copy } from "lucide-react";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

const steps = [
  {
    icon: PencilLine,
    step: "1",
    title: "Type your message",
    description: "Write the way you talk. Don't overthink it — ToneCraft starts from what you mean.",
  },
  {
    icon: SlidersHorizontal,
    step: "2",
    title: "Pick the tone & platform",
    description: "Choose the voice and where it's going. Professional email, friendly DM, sharp post.",
  },
  {
    icon: Copy,
    step: "3",
    title: "Copy the perfect version",
    description: "ToneCraft rewrites it instantly, ready to paste and send.",
  },
];

export function AIWorkflowSection() {
  return (
    <section id="how" className="relative py-28 md:py-36 overflow-hidden">
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
            How it works
          </motion.div>
          <motion.h2 variants={sectionItem} className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Three steps to perfect
          </motion.h2>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
        >
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              variants={sectionItem}
              className="relative text-center md:text-left"
            >
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+44px)] right-[calc(-50%+44px)] h-px bg-gradient-to-r from-border to-border/0" />
              )}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary font-semibold text-lg mb-5 relative">
                {s.step}
                <span className="sr-only">Step {s.step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 md:justify-start justify-center">
                <s.icon className="w-4 h-4 text-primary shrink-0" />
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
