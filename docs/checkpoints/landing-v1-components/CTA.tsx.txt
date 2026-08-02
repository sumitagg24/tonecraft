"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

const benefits = [
  "No credit card required",
  "50 messages per day free",
  "All 9 tone presets included",
  "Works on 8+ platforms",
  "Early Access — join now",
];

export function CTA() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="cta" ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.div variants={sectionChip}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Early Access — Start Free
          </motion.div>

          <motion.h2 variants={sectionItem}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-[0.95]"
          >
            Start writing<br />
            <span className="aurora-text">perfectly</span> today
          </motion.h2>

          <motion.p variants={sectionItem}
            className="text-muted-foreground text-lg max-w-xl mx-auto mb-10"
          >
            Join thousands of professionals who communicate better with ToneCraft. Free forever to start.
            <span className="block text-xs text-muted-foreground/60 mt-2">
              Early Access — new features rolling out weekly
            </span>
          </motion.p>

          <motion.div variants={sectionItem}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="xl" className="w-full sm:w-auto shadow-glow-lg gap-2 premium-btn" asChild>
                <Link href="/chat">
                  Start Writing Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="xl" variant="outline" className="w-full sm:w-auto gap-2" asChild>
                <Link href="#playground">
                  <Zap className="w-4 h-4" />
                  Try the Playground
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={sectionItem}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10"
          >
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                {benefit}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
