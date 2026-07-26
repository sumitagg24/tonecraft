"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, RefreshCw } from "lucide-react";

const DEMO_INPUT = "Hey bro I can't come today";

const PLATFORM_OUTPUTS: Record<string, Record<string, string>> = {
  gen_z: {
    label: "Gen Z",
    color: "#6366f1",
    output: "hey i can't make it today fr 😭 got other stuff goin on. we can hang l8r tho 🙏",
  },
  professional: {
    label: "Professional / Email",
    color: "#3b82f6",
    output: "Dear [Recipient],\n\nI regret to inform you that I am unable to attend today's scheduled event due to a prior commitment. I appreciate your understanding and look forward to rescheduling at a mutually convenient time.\n\nBest regards",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    output: "I appreciate the invite, but unfortunately I won't be able to attend today's session due to a scheduling conflict. I'd love to reconnect soon — let's find a time that works for both of us. Looking forward to staying in touch!",
  },
  instagram: {
    label: "Instagram",
    color: "#E4405F",
    output: "Heyyy! So sorry I can't make it today 😔 something came up and I'm totally bummed. Let's def reschedule tho — let me know when you're free! 🤗✨",
  },
  translation: {
    label: "Translation (FR)",
    color: "#14b8a6",
    output: "Malheureusement, je ne pourrai pas venir aujourd'hui en raison d'un engagement antérieur. J'apprécie votre compréhension et j'espère pouvoir nous revoir à un moment qui vous convient.\n\nCordialement",
  },
  summarization: {
    label: "Summarization",
    color: "#f97316",
    output: "Unable to attend today's event — prior commitment. Willing to reschedule when convenient.",
  },
};

const OUTPUT_ORDER = ["gen_z", "professional", "linkedin", "instagram", "translation", "summarization"];

export function InteractiveDemo() {
  const [input, setInput] = useState(DEMO_INPUT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [streamedOutputs, setStreamedOutputs] = useState<Record<string, string>>({});
  const generatingRef = useRef(false);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const streamText = useCallback((key: string, text: string) => {
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= text.length) {
        setStreamedOutputs((prev) => ({ ...prev, [key]: text }));
        clearInterval(interval);
      } else {
        setStreamedOutputs((prev) => ({ ...prev, [key]: text.slice(0, i) }));
      }
    }, 12);
    intervalsRef.current.push(interval);
  }, []);

  const handleGenerate = useCallback(() => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setActivePlatforms([]);
    setStreamedOutputs({});
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    OUTPUT_ORDER.forEach((key, i) => {
      setTimeout(() => {
        setActivePlatforms((prev) => [...prev, key]);
        const output = PLATFORM_OUTPUTS[key].output;
        streamText(key, output);
      }, i * 300);
    });

    setTimeout(() => {
      setIsGenerating(false);
      generatingRef.current = false;
    }, OUTPUT_ORDER.length * 300 + 200);
  }, [streamText]);

  const handleClear = useCallback(() => {
    setActivePlatforms([]);
    setStreamedOutputs({});
    setIsGenerating(false);
    generatingRef.current = false;
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Live Demo
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Watch ToneCraft in action
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Type a message. Watch it transform for every platform instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="glass-panel rounded-2xl p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="w-full bg-transparent border-0 resize-none px-4 py-3 text-base placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between px-3 pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Press Enter or click Generate</span>
              <div className="flex gap-2">
                {activePlatforms.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs">
                    <RefreshCw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating || !input.trim()}
                  className="gap-2 min-w-[120px]"
                >
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {Object.entries(PLATFORM_OUTPUTS).map(([key, platform]) => {
              const isActive = activePlatforms.includes(key);
              const displayOutput = streamedOutputs[key] || "";
              const isStreaming = isActive && displayOutput.length < platform.output.length;
              const Icon = platform.label.includes("Email") ? "✉️" : platform.label.includes("LinkedIn") ? "💼" : platform.label.includes("Instagram") ? "📸" : platform.label.includes("FR") ? "🌍" : platform.label.includes("Summar") ? "📝" : "💬";

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="group"
                >
                  <div className="glass-panel rounded-2xl p-5 shadow-card flex flex-col gap-3 hover:border-white/20 transition-all duration-300 min-h-[160px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: platform.color }} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {platform.label}
                        </span>
                      </div>
                      <span className="text-sm">{Icon}</span>
                    </div>
                    <div className="flex-1">
                      {isActive ? (
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-mono">
                          {displayOutput}
                          {isStreaming && (
                            <motion.span
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="inline-block w-0.5 h-4 ml-0.5 bg-primary align-middle"
                            />
                          )}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/40 italic font-mono">
                          {isGenerating ? "..." : "Waiting for input..."}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {activePlatforms.length === 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-muted-foreground">
              Click <span className="text-primary font-medium">Generate</span> to see the magic
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
