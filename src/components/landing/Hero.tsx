"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-16 pb-24">
      <div className="absolute inset-0 aurora-bg opacity-30 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={sectionReveal} initial="hidden" animate="visible">
          <motion.div
            variants={sectionChip}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel-strong mb-7"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs md:text-sm font-medium text-foreground/80">
              AI tone transformation · free to start
            </span>
          </motion.div>

          <motion.h1
            variants={sectionItem}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
          >
            Write once.
            <br />
            Speak <span className="aurora-text">perfectly</span>, everywhere.
          </motion.h1>

          <motion.p
            variants={sectionItem}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed"
          >
            ToneCraft rewrites your message for the right tone and platform —
            professional emails, friendly DMs, sharp LinkedIn posts — in one click.
          </motion.p>

          <motion.div
            variants={sectionItem}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
          >
            <Button size="xl" className="w-full sm:w-auto text-base px-8 shadow-glow-lg premium-btn" asChild>
              <Link href="/chat">
                Start Writing Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="xl" variant="glass" className="w-full sm:w-auto text-base px-8" asChild>
              <Link href="#demo">See it in action</Link>
            </Button>
          </motion.div>

          <motion.p variants={sectionItem} className="text-xs md:text-sm text-muted-foreground/70">
            Free plan · No credit card · 50 messages a day
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
