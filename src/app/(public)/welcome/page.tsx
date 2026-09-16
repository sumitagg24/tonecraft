import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Welcome to ToneCraft",
  description: "Your subscription is active. Start creating with AI-powered writing.",
  path: "/welcome",
});

export default function WelcomePage() {
  return (
    <main className="relative noise-bg min-h-screen flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6 text-center space-y-8">
        {/* Success icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">
            Welcome to ToneCraft
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Your subscription is active. You now have full access to all features
            in your plan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Start Writing
          </Link>
          <Link
            href="/billing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            View Billing
          </Link>
        </div>
      </div>
    </main>
  );
}
