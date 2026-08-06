"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ArrowRight, ArrowDown, Lock } from "lucide-react";
import Link from "next/link";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";
import { cn } from "@/lib/utils";

const DEMO_LIMIT = 3;
const DEMO_STORAGE_KEY = "tonecraft:landing:demosUsed";

const DEMO_TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "funny", label: "Funny" },
  { id: "creative", label: "Creative" },
  { id: "minimal", label: "Minimal" },
  { id: "slang", label: "Slang" },
] as const;

type DemoTone = (typeof DEMO_TONES)[number]["id"];

const DEFAULT_INPUT = "hey i can't make it today, rain check?";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function rewrite(input: string, tone: DemoTone): string {
  const t = input.trim();
  if (!t) return "";
  switch (tone) {
    case "professional":
      return `${capitalize(
        t
          .replace(/\bcan't\b/gi, "cannot")
          .replace(/\bgonna\b/gi, "going to")
          .replace(/\bwanna\b/gi, "want to")
          .replace(/\b(u)\b/gi, "you")
      )}\n\nI trust this clarifies the situation — happy to discuss further at your convenience.`;
    case "friendly":
      return `Hey! ${capitalize(t)}\n\nLet me know if that works for you — happy to help!`;
    case "funny":
      return `${capitalize(t)} — and yes, I'm only 90% joking.`;
    case "creative":
      return `${capitalize(t)}\n\nPicture this unfolding exactly the way I mean it.`;
    case "minimal":
      return `${capitalize(t).replace(/[?!.]+$/g, "").replace(/[,\s]+/g, " ").trim()}.`;
    case "slang":
      return `${capitalize(t)}\n\nfr fr, no cap — raincheck?`;
  }
}

export function InteractiveDemo() {
  const prefersReduced = useReducedMotion();
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [tone, setTone] = useState<DemoTone>("professional");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(DEMO_STORAGE_KEY) || "0");
    setGenerationsUsed(stored);
  }, []);

  const isLimitReached = generationsUsed >= DEMO_LIMIT;

  const incrementGenerations = useCallback(() => {
    const next = generationsUsed + 1;
    setGenerationsUsed(next);
    localStorage.setItem(DEMO_STORAGE_KEY, String(next));
  }, [generationsUsed]);

  const handleGenerate = useCallback(() => {
    if (isGenerating || isLimitReached || !input.trim()) return;
    incrementGenerations();
    const result = rewrite(input, tone);
    setOutput("");
    setIsGenerating(true);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const finish = () => {
      setOutput(result);
      setIsGenerating(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    if (prefersReduced) {
      setTimeout(finish, 400);
      return;
    }

    let i = 0;
    intervalRef.current = setInterval(() => {
      i += 3;
      if (i >= result.length) {
        finish();
      } else {
        setOutput(result.slice(0, i));
      }
    }, 16);
  }, [input, tone, isGenerating, prefersReduced]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setOutput("");
    setIsGenerating(false);
  }, []);

  return (
    <section id="demo" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            variants={sectionChip}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try it now
          </motion.div>
          <motion.h2 variants={sectionItem} className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            One message, any tone
          </motion.h2>
          <motion.p variants={sectionItem} className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Type a message, pick a tone, and watch it transform before your eyes.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-2xl p-4 md:p-5 shadow-card"
        >
          <label htmlFor="demo-input" className="sr-only">
            Your message
          </label>
          <textarea
            id="demo-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            placeholder="Type a message to transform..."
            rows={3}
            className="w-full bg-transparent border-0 resize-none px-2 py-1 text-base placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0"
          />

          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">Tone</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a tone">
              {DEMO_TONES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={tone === t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                    tone === t.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">Press ⌘/Ctrl + Enter</span>
                <span className="text-xs text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground/60">
                  {generationsUsed}/{DEMO_LIMIT} demos
                </span>
              </div>
              <div className="flex gap-2">
                {output && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
                {isLimitReached ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 min-w-[120px]"
                    asChild
                  >
                    <Link href="/chat">
                      <Lock className="w-3.5 h-3.5" />
                      Limit reached
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !input.trim()}
                    className="gap-2 min-w-[120px]"
                  >
                    {isGenerating ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </motion.span>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isGenerating ? "Generating…" : "Generate"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {(output || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-4"
            >
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-xs font-medium text-muted-foreground mb-2.5">Your message</p>
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{input}</p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
              <div className="flex md:hidden items-center justify-center">
                <ArrowDown className="w-5 h-5 text-primary" />
              </div>

              <div className="glass-panel rounded-2xl p-5 border-primary/30">
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  {DEMO_TONES.find((t) => t.id === tone)?.label} version
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {output}
                  {isGenerating && <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary align-middle" aria-hidden="true" />}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild>
            <Link href="/chat">
              Try it in the app — it&apos;s free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
