import type { Metadata } from "next";
import Link from "next/link";
import { Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Roadmap — ToneCraft",
  description:
    "What's next for ToneCraft — team collaboration, voice & dictation, the AI marketplace, and agentic workflows.",
  path: "/roadmap",
});

const PHASES = [
  {
    phase: "Now",
    title: "Core communication",
    items: ["AI rewriting & tone control", "Platform-specific drafts", "Prompt library & personas", "Knowledge-grounded chat"],
    done: true,
  },
  {
    phase: "Next",
    title: "Team & productivity",
    items: ["Workspaces & collaboration", "Kanban, notes & calendar", "Voice & dictation", "Multi-language publishing"],
    done: false,
  },
  {
    phase: "Later",
    title: "Platform",
    items: ["AI Marketplace", "Agentic workflows & smart automation", "Memory & context graph", "Voice & multimodal input"],
    done: false,
  },
];

export default function RoadmapPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Rocket className="w-3 h-3" />
            Roadmap
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Where we&apos;re headed</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            A clear path from a brilliant writing tool to a full communication platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PHASES.map((phase) => (
            <div key={phase.phase} className="glass-panel rounded-2xl p-6 flex flex-col hover:border-border/70 hover:shadow-card transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                  {phase.phase}
                </span>
                {phase.done && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                    <Check className="w-3 h-3" /> Live
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base mb-3">{phase.title}</h3>
              <ul className="space-y-2.5 mt-auto">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Join the Journey</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
