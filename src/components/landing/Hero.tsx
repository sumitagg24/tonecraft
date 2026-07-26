"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { Particles } from "@/components/landing/Particles";
import { wordReveal } from "@/styles/motion";
import { useSpotlightEffect } from "@/hooks/use-tilt-effect";

const MORPH_WORDS = ["perfectly", "naturally", "elegantly", "effortlessly"];

function WordStagger({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          custom={i}
          variants={wordReveal}
          initial="hidden"
          animate="visible"
          className="inline-block"
          style={{ whiteSpace: "pre" }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </motion.span>
      ))}
    </span>
  );
}

function MagneticButton({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  };

  const onMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <div
      ref={ref}
      data-magnetic
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="transition-transform duration-200 ease-out"
    >
      {children}
    </div>
  );
}

function FloatingMessageCard({ text, tone, delay = 0 }: { text: string; tone: "professional" | "friendly" | "funny"; delay?: number }) {
  const toneColors = {
    professional: "#3b82f6",
    friendly: "#10b981",
    funny: "#f97316",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="glass-panel-strong rounded-2xl p-4 shadow-card max-w-[280px]"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: toneColors[tone] }} />
        <span className="text-xs font-medium text-muted-foreground capitalize">{tone}</span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
    </motion.div>
  );
}

function MorphTitle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MORPH_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block min-w-[200px]">
      {MORPH_WORDS.map((word, i) => (
        <motion.span
          key={word}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={
            i === index
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: -12, filter: "blur(4px)" }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute left-0 top-0 aurora-text"
        >
          {word}
        </motion.span>
      ))}
      <span className="invisible">{MORPH_WORDS[0]}</span>
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((dot) => (
        <motion.span
          key={dot}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.1 }}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
      ))}
    </div>
  );
}

const heroContent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const heroFloating: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.6 },
  },
};

const heroFloatItem: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, -50]);
  const y2 = useTransform(scrollY, [0, 600], [0, -80]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const spotlight = useSpotlightEffect();

  return (
    <section
      ref={sectionRef}
      onMouseMove={spotlight.onMouseMove}
      className="relative spotlight min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32"
    >
      <Particles />

      <div className="absolute inset-0 aurora-bg opacity-40" />
      <motion.div ref={spotlight.ref} style={{ y: y1, opacity }} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-breathe" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          variants={heroContent}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel-strong mb-8">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-foreground/80">No credit card required</span>
          </motion.div>

          <motion.h1 variants={heroItem} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.95]">
            <WordStagger text="Write Once." className="block" />
            <span className="block mt-2">
              <WordStagger text="Speak" /> <MorphTitle />
            </span>
            <span className="block mt-2 aurora-text">Everywhere.</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            ToneCraft rewrites your messages for WhatsApp, LinkedIn, Email, Slack and 8+ platforms —
            instantly adapting tone, style, and platform conventions.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <MagneticButton>
              <Button size="xl" className="w-full sm:w-auto text-base px-10 shadow-glow-lg group premium-btn" asChild>
                <Link href="/chat">
                  Start Writing Free
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button size="xl" variant="glass" className="w-full sm:w-auto text-base px-10 gap-2" asChild>
                <Link href="/#demo">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Link>
              </Button>
            </MagneticButton>
          </motion.div>
        </motion.div>

        <motion.div
          variants={heroFloating}
          initial="hidden"
          animate="visible"
          className="relative h-[200px] md:h-[240px] max-w-4xl mx-auto"
        >
          <motion.div
            style={{ y: y2 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center gap-4 md:gap-6"
          >
            <motion.div variants={heroFloatItem}>
              <FloatingMessageCard text="Hey, I can't make it today. Rain check?" tone="friendly" delay={0} />
            </motion.div>
            <div className="flex flex-col gap-4">
              <motion.div variants={heroFloatItem}>
                <FloatingMessageCard text="Unfortunately, I have a prior commitment and cannot attend at this time." tone="professional" delay={0} />
              </motion.div>
              <motion.div variants={heroFloatItem}>
                <FloatingMessageCard text="Sorry mate, got other plans. Let's catch up soon though!" tone="funny" delay={0} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <TypingIndicator />
          <span className="text-xs text-muted-foreground">Generating responses...</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-muted-foreground/50 rounded-full animate-scroll-indicator" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
