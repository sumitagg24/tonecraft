"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight, ArrowDown, Lock, PenTool, AtSign, Hash, Mail, Camera, MessageSquare, Minus, Maximize2, Briefcase, Laugh } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/social-icons";
import Link from "next/link";
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

const QUICK_ACTIONS = [
  { id: "twitter", label: "Twitter", icon: AtSign },
  { id: "threads", label: "Threads", icon: Hash },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon },
  { id: "email", label: "Email", icon: Mail },
  { id: "instagram", label: "Instagram", icon: Camera },
  { id: "reddit", label: "Reddit", icon: MessageSquare },
  { id: "shorten", label: "Shorten", icon: Minus },
  { id: "expand", label: "Expand", icon: Maximize2 },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "funny", label: "Funny", icon: Laugh },
] as const;

type QuickActionId = (typeof QUICK_ACTIONS)[number]["id"];

/** Lightweight client-side demo transform for the one-click action row. */
function applyAction(input: string, action: QuickActionId): string {
  const t = input.trim().replace(/[.!?]+$/, "");
  if (!t) return "";
  switch (action) {
    case "twitter":
      return `${t.slice(0, 240)}…\n\nWhat's your take? 👇\n#ToneCraft`;
    case "threads":
      return `${t} — no cap, this has been on my mind all week. What do you think?`;
    case "linkedin":
      return `${capitalize(t)}\n\nI've been reflecting on this a lot lately — the words we choose genuinely shape how we're heard. Curious what your experience has been.\n\n#Communication #ToneCraft`;
    case "email":
      return `Subject: A quick update — ${t.slice(0, 42)}…\n\nHi there,\n\n${t}. I wanted to share this with you and see what you think.\n\nBest regards,\n[Your name]`;
    case "instagram":
      return `${t} ✨\n\nSave this for later — trust me.\n\n#DailyPost #Motivation #ToneCraft`;
    case "reddit":
      return `**${t}**\n\n(Context: this came up in a conversation and I'd love a second opinion. What would you do?)`;
    case "shorten":
      return t.split(/[.!?]+/)[0] + ".";
    case "expand":
      return `${t}. More specifically, the details matter here: the timing, the audience, and the exact wording all change how the message lands — which is exactly why having the right version ready matters.`;
    case "professional":
      return `${capitalize(t)}.\n\nI trust this provides the clarity you need — happy to discuss further at your convenience.`;
    case "funny":
      return `${t} — and yes, I'm only 90% joking. The other 10% is fully committed.`;
  }
}

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
  const [lastAction, setLastAction] = useState<string | null>(null);
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
    setLastAction(null);
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
  }, [input, tone, isGenerating, prefersReduced, isLimitReached, incrementGenerations]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setOutput("");
    setIsGenerating(false);
  }, []);

  /** One-click platform / transform actions applied to the current text. */
  const handleQuickAction = useCallback(
    (action: QuickActionId) => {
      if (isGenerating) return;
      const base = (output || input).trim();
      if (!base) return;
      setLastAction(QUICK_ACTIONS.find((a) => a.id === action)?.label ?? null);
      const result = applyAction(base, action);
      setOutput("");
      setIsGenerating(true);
      if (prefersReduced) {
        setTimeout(() => {
          setOutput(result);
          setIsGenerating(false);
        }, 250);
        return;
      }
      let i = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        i += 5;
        if (i >= result.length) {
          setOutput(result);
          setIsGenerating(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setOutput(result.slice(0, i));
        }
      }, 16);
    },
    [input, output, isGenerating, prefersReduced]
  );

  return (
    <section id="demo" className="relative py-28 md:py-36 overflow-hidden bg-muted/30 border-y border-border/40">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand/25 bg-brand/10 text-brand text-xs font-medium mb-4">
            <PenTool className="w-3.5 h-3.5" />
            Interactive Demonstration
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            One message, any tone
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Type a message, pick a tone, and watch it transform with real-time editorial craft.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-background border border-border/60 shadow-[0_32px_90px_-28px_hsl(var(--brand)/0.28)]"
        >
          {/* Window chrome */}
          <div className="window-titlebar flex items-center gap-2.5 px-4 h-11">
            <span className="window-dot bg-[#ff5f57]" aria-hidden="true" />
            <span className="window-dot bg-[#febc2e]" aria-hidden="true" />
            <span className="window-dot bg-[#28c840]" aria-hidden="true" />
            <p className="flex-1 text-center text-xs font-medium text-muted-foreground/80 truncate">
              ToneCraft Studio — Live Demo
            </p>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse-soft" aria-hidden="true" />
              Streaming-ready
            </span>
          </div>
          <div className="p-6 md:p-8">
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
            className="w-full bg-transparent border-0 resize-none p-2 text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
          />            <div className="mt-6 pt-5 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wide uppercase">Select Tone</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a tone">
              {DEMO_TONES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={tone === t.id}
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200",
                    tone === t.id
                      ? "bg-foreground text-background border-foreground shadow-editorial"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* One-click platform & transform actions */}
            <div className="mt-5 pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-3 font-medium tracking-wide uppercase">One-Click Actions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleQuickAction(a.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-border transition-all duration-200 active:scale-[0.97]"
                  >
                    <a.icon className="w-3.5 h-3.5" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">Press Ctrl + Enter</span>
                <span className="text-xs text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground/60">
                  {generationsUsed}/{DEMO_LIMIT} free demos
                </span>
              </div>
              <div className="flex gap-2">
                {output && (
                  <Button variant="ghost" size="sm" onClick={() => { handleReset(); setLastAction(null); }} className="text-xs rounded-xl h-10">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Reset
                  </Button>
                )}
                {isLimitReached ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 rounded-xl h-10 border-border/60"
                    asChild
                  >
                    <Link href="/sign-up?redirect_url=%2Fchat">
                      <Lock className="w-3.5 h-3.5" />
                      Sign Up Free for Unlimited
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || !input.trim()}
                    className="gap-2 rounded-xl h-10 px-6 font-medium shadow-editorial"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    {isGenerating ? "Crafting…" : "Transform Tone"}
                  </Button>
                )}
              </div>
            </div>
          </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {(output || isGenerating) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-6"
            >
              <div className="bg-background rounded-3xl p-6 border border-border/60 shadow-editorial">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Original Input</p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{input}</p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex md:hidden items-center justify-center">
                <ArrowDown className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="bg-background rounded-3xl p-6 border border-foreground/20 shadow-editorial-lg">
                <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">
                  {lastAction ?? `${DEMO_TONES.find((t) => t.id === tone)?.label} Tone`}
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {output}
                  {isGenerating && <span className="inline-block w-0.5 h-4 ml-0.5 bg-foreground align-middle animate-pulse" aria-hidden="true" />}
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
          className="text-center mt-12"
        >
          <Button size="lg" asChild className="rounded-2xl h-14 px-8 shadow-editorial text-base">
            <Link href="/sign-up?redirect_url=%2Fchat">
              Start Writing Free — No Credit Card
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
