import Link from "next/link";
import { MessageSquare, Music2, Languages, Zap, CheckCircle2, Layers, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: MessageSquare, title: "Platform-perfect, every time", desc: "Rewrites follow the conventions of Email, LinkedIn, Slack, WhatsApp and 8+ platforms." },
  { icon: Music2, title: "Tones that match you", desc: "Nine built-in voices — or create custom personas that sound exactly like you." },
  { icon: Languages, title: "50+ languages", desc: "Write once, speak globally. Your tone carries across every language." },
  { icon: Zap, title: "One-click transform", desc: "Any draft becomes the right version for the right audience, instantly." },
  { icon: CheckCircle2, title: "Grammar & style", desc: "Cleaner, sharper writing — as a side effect of every single rewrite." },
  { icon: Layers, title: "Templates & prompts", desc: "Start from proven structures for emails, pitches, posts and more." },
];

export default function FeaturesPage() {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Wand2 className="w-3 h-3" />
            Features
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Everything you need to communicate better</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            ToneCraft handles the details, so you can focus on what to say.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-panel rounded-2xl p-6 hover:border-border/70 hover:shadow-card transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
