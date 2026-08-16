"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check, Wand2 } from "lucide-react";
import { ease } from "@/styles/motion";

const TONE_WORDS = [
  "perfectly",
  "professionally",
  "poetically",
  "elegantly",
  "persuasively",
];

const PREVIEW_CHIPS = ["Professional", "Friendly", "Funny", "Concise"];

export function Hero() {
  const prefersReduced = useReducedMotion();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (prefersReduced) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % TONE_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [prefersReduced]);

  const headlineVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: ease.emphasizedDecel },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32">
      {/* ── Background: dot grid + brand glow ─────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 dot-grid opacity-70 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]" />
        <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[900px] h-[540px] rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(var(--brand)/0.14),transparent)]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[520px] h-[520px] rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(255_255_255/0.04),transparent)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="eyebrow mb-8"
        >
          The AI Communication Studio
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={headlineVariants}
          initial="hidden"
          animate="visible"
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-8"
        >
          <motion.span variants={wordVariants} className="block">
            Write once.
          </motion.span>
          <motion.span variants={wordVariants} className="block mt-2">
            Speak{" "}
            <span className="relative inline-block">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: ease.emphasizedDecel }}
                className="text-brand"
              >
                {TONE_WORDS[wordIndex]}
              </motion.span>
            </span>
            ,
          </motion.span>
          <motion.span variants={wordVariants} className="block mt-2">
            everywhere.
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed"
        >
          ToneCraft transforms your words for every audience,
          platform, and emotional intent — with single-click precision.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          <Button
            size="lg"
            className="w-full sm:w-auto text-base px-8 rounded-2xl h-14 text-white bg-gradient-to-r from-brand to-amber-500 hover:from-brand/95 hover:to-amber-500/95 hover:text-white border-0 shadow-[0_8px_32px_-8px_hsl(var(--brand)/0.55)]"
            asChild
          >
            <Link href="/sign-up?redirect_url=%2Fchat">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base px-8 rounded-2xl h-14 shadow-none border-border/60"
            asChild
          >
            <Link href="#demo">
              <Play className="w-4 h-4" />
              Watch Demo
            </Link>
          </Button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium"
        >
          {["No credit card", "Free forever", "50 AI generations/day"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500/80" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Studio window preview ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.1, ease: ease.emphasizedDecel }}
        className="relative z-10 w-full max-w-3xl mx-auto px-6 mt-20 mb-24"
      >
        <div className="relative">
          <div
            className="absolute -inset-x-10 -top-10 h-48 rounded-full blur-3xl bg-[radial-gradient(closest-side,hsl(var(--brand)/0.12),transparent)]"
            aria-hidden="true"
          />
          <div className="window-chrome relative rounded-2xl overflow-hidden">
            {/* Title bar */}
            <div className="window-titlebar flex items-center gap-2.5 px-4 h-11">
              <span className="window-dot bg-[#ff5f57]" aria-hidden="true" />
              <span className="window-dot bg-[#febc2e]" aria-hidden="true" />
              <span className="window-dot bg-[#28c840]" aria-hidden="true" />
              <p className="flex-1 text-center text-xs font-medium text-muted-foreground/80 truncate">
                ToneCraft — Compose Studio
              </p>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" aria-hidden="true" />
                Live
              </span>
            </div>

            {/* Body: input → output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-3">
                  Original
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;hey i can&rsquo;t make it today, rain check?&rdquo;
                </p>
              </div>
              <div className="p-5 bg-white/[0.02]">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
                  Professional
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;Hi there — I won&rsquo;t be able to make it today.
                  Would you like to reschedule?&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="window-titlebar flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {PREVIEW_CHIPS.map((chip, i) => (
                  <span
                    key={chip}
                    className={
                      i === 0
                        ? "px-2.5 py-1 rounded-full text-[11px] font-medium bg-foreground text-background"
                        : "px-2.5 py-1 rounded-full text-[11px] font-medium text-muted-foreground border border-white/10"
                    }
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-brand-foreground text-[11px] font-semibold">
                <Wand2 className="w-3 h-3" aria-hidden="true" />
                Rewrite
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      >
        <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/20 flex justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/30 animate-scroll-indicator" />
        </div>
      </motion.div>
    </section>
  );
}
