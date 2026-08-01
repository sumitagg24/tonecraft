"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useTiltEffect } from "@/hooks/use-tilt-effect";

const featureCards = [
  {
    title: "Multi-Platform Adaptation",
    description: "One message, perfect for every platform. ToneCraft automatically adjusts punctuation, formality, and length for each target channel.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    ),
    color: "#3b82f6",
    tags: ["WhatsApp", "Email", "Slack", "LinkedIn"],
  },
  {
    title: "Real-Time Tone Detection",
    description: "Instantly identifies the emotional tone of any message and suggests the best rewrite. No more ambiguous or tone-deaf communication.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
    ),
    color: "#a855f7",
    tags: ["Emotion", "Context", "AI Analysis"],
  },
  {
    title: "Smart Templates",
    description: "Save your go-to message structures and reuse them with a single click. Build a personal library of perfect responses over time.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
    ),
    color: "#10b981",
    tags: ["Templates", "Saved", "Reusable"],
  },
  {
    title: "One-Click Platform Transform",
    description: "Switch between platforms instantly. A LinkedIn message becomes a casual DM in one click. Watch your communication adapt in real time.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    ),
    color: "#f43f5e",
    tags: ["Instant", "Switch", "Live Preview"],
  },
  {
    title: "Grammar & Style Engine",
    description: "Beyond just tone — Fix grammar, improve clarity, eliminate filler words. Every message comes out polished and professional.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    ),
    color: "#f97316",
    tags: ["Grammar", "Clarity", "Style"],
  },
  {
    title: "50+ Language Support",
    description: "Translate while preserving emotional intent and cultural nuance. Not word-for-word — but true communication adaptation.",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
    color: "#14b8a6",
    tags: ["Translate", "50+", "Cultural"],
  },
];

function TiltedCard({ index, inView, onToggle, children }: {
  index: number;
  inView: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { ref: tiltRef, onMouseMove: handleTiltMove, onMouseLeave: handleTiltLeave } = useTiltEffect({ max: 4, scale: 1.005 });

  return (
    <motion.div
      ref={tiltRef}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      style={{ transformStyle: "preserve-3d" }}
      className="group"
    >
      <Card
        className="h-full overflow-hidden bg-surface/50 border-border/40 hover:border-white/10 transition-all duration-300 cursor-pointer group-hover:shadow-card"
        onClick={onToggle}
      >
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function FeatureShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <section id="features" ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Everything you need to communicate
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From first draft to final send — ToneCraft has you covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, i) => (
            <TiltedCard
              key={card.title}
              index={i}
              inView={inView}
              onToggle={() => setExpandedCard(expandedCard === card.title ? null : card.title)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: card.color + "20", color: card.color }}
                >
                  {card.icon}
                </div>
                <h3 className="font-semibold text-base">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <motion.div
                initial={false}
                animate={{ height: expandedCard === card.title ? "auto" : 0, opacity: expandedCard === card.title ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This feature is available on all plans. Pro users get priority processing and custom model access.
                  </p>
                </div>
              </motion.div>
            </TiltedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
