"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const bentoItems = [
  {
    title: "One Message, Infinite Tones",
    description: "Write once, transform into 9+ communication styles instantly. Professional LinkedIn, romantic texts, corporate emails — all from one input.",
    icon: "Sparkles",
    size: "large",
    color: "#a855f7",
    accent: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.05))",
  },
  {
    title: "Platform-Perfect Output",
    description: "WhatsApp casualness. LinkedIn professionalism. Email formality. Every platform has its own grammar of communication.",
    icon: "Globe",
    size: "small",
    color: "#3b82f6",
    accent: "rgba(59, 130, 246, 0.08)",
  },
  {
    title: "50+ Languages",
    description: "Translate while preserving tone. Not a word-for-word translation, but a cultural adaptation.",
    icon: "Flag",
    size: "small",
    color: "#14b8a6",
    accent: "rgba(20, 184, 166, 0.08)",
  },
  {
    title: "Voice Input",
    description: "Speak naturally. ToneCraft listens and transforms your spoken words into perfectly written messages.",
    icon: "Mic",
    size: "medium",
    color: "#f43f5e",
    accent: "rgba(244, 63, 94, 0.08)",
  },
  {
    title: "Screenshot OCR",
    description: "Upload any screenshot. ToneCraft extracts the text and rewrites it for your target platform.",
    icon: "Image",
    size: "medium",
    color: "#f97316",
    accent: "rgba(249, 115, 22, 0.08)",
  },
  {
    title: "History & Favorites",
    description: "Every transformation saved. Build your library of perfect messages over time.",
    icon: "Bookmark",
    size: "small",
    color: "#d4a853",
    accent: "rgba(212, 168, 83, 0.08)",
  },
];

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L14.5 8.5L20 10L14.5 11.5L12 17L9.5 11.5L4 10L9.5 8.5L12 3Z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20zM2 12h20" />
    </svg>
  ),
  Flag: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  Mic: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  Image: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Bookmark: () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  ),
};

export function BentoGrid() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            Why ToneCraft
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Built for the way you really communicate
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
          {bentoItems.map((item, i) => {
            const Icon = icons[item.icon];
            const isLarge = item.size === "large";
            const isMedium = item.size === "medium";

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`
                  group relative overflow-hidden rounded-2xl border border-border/40 transition-all duration-300 hover:border-white/10 hover:shadow-card cursor-pointer
                  ${isLarge ? "md:col-span-2 md:row-span-2" : ""}
                  ${isMedium ? "md:col-span-2" : ""}
                `}
                style={{ background: item.accent }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="relative z-10 h-full flex flex-col justify-between p-6 md:p-8">
                  <div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <Icon />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-foreground/60 group-hover:text-foreground transition-colors">
                    Learn more
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.span>
                  </div>
                </CardContent>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
