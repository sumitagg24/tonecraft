import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SOLUTIONS } from "@/lib/marketing";

export default function SolutionsPage() {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Solutions
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-6">
            Built for the way you communicate
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            ToneCraft adapts to your world. Choose your role and discover the exact tools, tones, and
            workflows that make every message land.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SOLUTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/solutions/${s.slug}`}
              className="group glass-panel rounded-2xl p-7 hover:border-border/70 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-2xl tracking-tight mb-2">{s.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 min-h-[60px]">{s.tagline}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                Explore solution
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
