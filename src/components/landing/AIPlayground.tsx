"use client";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, RotateCcw } from "lucide-react";

const PRESETS = [
  { label: "Casual text → Professional email", input: "hey, can u send me the files? thx" },
  { label: "Direct message → LinkedIn post", input: "we need to hire a new dev asap" },
  { label: "Short reply → Polished response", input: "sounds good, let's do it" },
  { label: "Rough idea → Sales pitch", input: "our product helps teams save time on emails" },
];

const TONES = [
  { id: "professional", label: "Professional", color: "#3b82f6" },
  { id: "friendly", label: "Friendly", color: "#10b981" },
  { id: "luxury", label: "Luxury", color: "#d4a853" },
  { id: "creative", label: "Creative", color: "#a855f7" },
];

const OUTPUTS: Record<string, Record<string, string>> = {
  "Casual text → Professional email": {
    professional: "Dear Team,\n\nI hope this message finds you well. Could you please send me the requested files at your earliest convenience?\n\nThank you in advance for your assistance.\n\nBest regards",
    friendly: "Hey team! Hope you're doing well. Could you send those files over when you get a chance? Thanks a bunch!",
    luxury: "To Whom It May Concern,\n\nI would be most grateful if you could kindly forward the aforementioned documents at your earliest possible convenience.\n\nWith anticipation and appreciation",
    creative: "Hello wonderful humans! ✨ The files are calling my name — would you be so kind as to send them my way? Can't wait to dive in! 🌟",
  },
  "Direct message → LinkedIn post": {
    professional: "We're excited to announce that we're expanding our engineering team! We're looking for talented developers who share our passion for innovation. If you or someone in your network might be interested, we'd love to connect.",
    friendly: "Big news! We're hiring a new developer to join our awesome team! 🚀 Know someone who'd be a great fit? Send them our way!",
    luxury: "We are delighted to announce an exceptional opportunity to join our distinguished engineering team. We seek individuals of remarkable talent and vision. Inquiries from distinguished candidates are warmly welcomed.",
    creative: "The quest begins! 🏰 We're on the hunt for a legendary developer to join our fellowship. Do you have the skills and the spirit? The adventure awaits! ⚔️",
  },
  "Short reply → Polished response": {
    professional: "Thank you for your proposal. I've reviewed the details and agree that moving forward with this plan would be beneficial. Please let me know the next steps.",
    friendly: "Sounds great! I'm on board with this. Let's make it happen! Let me know what you need from me.",
    luxury: "I have given your proposal the thoughtful consideration it deserves and am pleased to confirm my enthusiastic endorsement of this initiative.",
    creative: "Love it! The energy is right and the plan is solid. Let's roll up our sleeves and make some magic happen! ✨",
  },
  "Rough idea → Sales pitch": {
    professional: "Our platform helps teams reclaim hours lost to email management. By automating routine responses and optimizing communication workflows, we help you focus on what matters most.",
    friendly: "Tired of drowning in emails? We've got the solution! Our platform helps your team cut email time in half so you can focus on the work that actually matters.",
    luxury: "Presenting the epitome of communication efficiency: a solution that transforms your team's correspondence into an art form of productivity and elegance.",
    creative: "Imagine a world where emails write themselves. Your team, liberated from the inbox, creating, building, and doing what they do best. That world is here. 🚀",
  },
};

export function AIPlayground() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].label);
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const generatingRef = useRef(false);

  const currentPreset = PRESETS.find((p) => p.label === selectedPreset)!;

  const handleGenerate = useCallback(() => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setOutput("");
    setHasGenerated(false);

    const fullOutput = OUTPUTS[selectedPreset]?.[selectedTone] ?? "Output coming soon.";
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= fullOutput.length) {
        setOutput(fullOutput);
        clearInterval(interval);
        generatingRef.current = false;
        setIsGenerating(false);
        setHasGenerated(true);
      } else {
        setOutput(fullOutput.slice(0, i));
      }
    }, 15);
  }, [selectedPreset, selectedTone]);

  return (
    <section id="playground" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Wand2 className="w-3.5 h-3.5" />
            Try It Free
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Transform any message instantly
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No sign-up required. Pick a preset, choose a tone, and watch the magic happen.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                Choose a scenario
              </label>
              <div className="space-y-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => { setSelectedPreset(preset.label); setOutput(""); setHasGenerated(false); }}
                    className={`w-full text-left p-3.5 rounded-xl text-sm transition-all duration-200 ${
                      selectedPreset === preset.label
                        ? "glass-panel-strong border-primary/30"
                        : "glass-panel hover:border-white/20"
                    }`}
                  >
                    <span className="block text-foreground font-medium">{preset.label.split("→")[0].trim()}</span>
                    <span className="block text-muted-foreground text-xs mt-0.5">
                      → {preset.label.split("→")[1].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                Choose a tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => { setSelectedTone(tone.id); setOutput(""); setHasGenerated(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedTone === tone.id
                        ? "text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground glass-panel"
                    }`}
                    style={selectedTone === tone.id ? { backgroundColor: tone.color } : {}}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? "Transforming..." : "Transform"}
              </Button>
            </motion.div>
          </div>

          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full flex flex-col"
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Input</span>
                <span className="text-[10px] text-muted-foreground/60">Preset message</span>
              </div>
              <div className="glass-panel rounded-2xl p-4 mb-4">
                <p className="text-sm text-foreground/80 italic">&ldquo;{currentPreset.input}&rdquo;</p>
              </div>

              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Output</span>
                {hasGenerated && (
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Regenerate
                  </button>
                )}
              </div>
              <div className="flex-1 glass-panel-strong rounded-2xl p-5 min-h-[200px]">
                {output ? (
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {output}
                    {isGenerating && (
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-0.5 h-4 ml-0.5 bg-primary align-middle"
                      />
                    )}
                  </p>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground/60">
                      {isGenerating ? "Transforming..." : "Click Transform to see the result"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
