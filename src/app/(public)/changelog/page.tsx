import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EntryType = "New" | "Improved" | "Fixed";

const ENTRIES: {
  version: string;
  date: string;
  type: EntryType;
  title: string;
  body: string[];
}[] = [
  {
    version: "v1.4.0",
    date: "Aug 2026",
    type: "New",
    title: "Faster default routing & upgraded models",
    body: [
      "The writing engine now picks the fastest path from draft to send with automatic routing and failover.",
      "Underlying AI models upgraded for sharper, more natural output — selection stays fully automatic.",
      "Local fallback engine no longer errors on credit accounting when cloud backends are unavailable.",
    ],
  },
  {
    version: "v1.3.1",
    date: "Aug 2026",
    type: "Fixed",
    title: "PWA manifest, icons & SSL hardening",
    body: [
      "Web app manifest, service worker, and app icons now serve correctly (previously redirected to sign-in).",
      "Postgres connections normalize sslmode to verify-full, silencing the pg deprecation warning.",
      "Smooth-scroll route transitions no longer warn; theme stays light-first with a polished dark mode.",
    ],
  },
  {
    version: "v1.2.0",
    date: "Jul 2026",
    type: "New",
    title: "AI Memory & voice/multimodal",
    body: [
      "Long-term memory scoped to users, workspaces, teams, and agents — with a lightweight knowledge graph.",
      "Voice input (STT), text-to-speech output, and image understanding across compatible AI endpoints.",
      "Semantic recall now grounds replies in remembered facts with importance tracking.",
    ],
  },
  {
    version: "v1.1.0",
    date: "Jun 2026",
    type: "New",
    title: "AI Marketplace",
    body: [
      "Publish and install prompts, agents, workflows, personas, and templates.",
      "Creator profiles, follows, star reviews, and trending scoring drive discovery.",
      "Featured collections and per-listing download counts make the marketplace feel lived-in.",
    ],
  },
  {
    version: "v1.0.0",
    date: "Jun 2026",
    type: "New",
    title: "Enterprise & platform launch",
    body: [
      "Organization → Team → Workspace hierarchy with roles, SSO, security policies, and audit logs.",
      "Admin dashboard with storage, credits, projects, knowledge, and AI-usage metrics.",
      "Real-time notifications (SSE), comment mentions, and daily digests.",
    ],
  },
  {
    version: "v0.9.0",
    date: "May 2026",
    type: "Improved",
    title: "Reliability & production hardening",
    body: [
      "Per-provider rate limiting, exponential retry with failover, and idle-timeout streaming.",
      "Centralized logging, error boundaries, and skeleton loading across every route group.",
      "Zero TypeScript errors; full `next build` green end-to-end.",
    ],
  },
  {
    version: "v0.8.0",
    date: "Apr 2026",
    type: "New",
    title: "AI writing engine & collaboration",
    body: [
      "Intent-aware prompt library: rewrite, reply, email, social, grammar, and workflow tools.",
      "Real-time presence, typing indicators, and version history for collaborative workspaces.",
      "Credit-based usage guard with per-plan limits and transparent upgrade prompts.",
    ],
  },
];

const TYPE_STYLES: Record<EntryType, string> = {
  New: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Improved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Fixed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function ChangelogPage() {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Changelog
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-6">What&apos;s new at ToneCraft</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Every release, documented. New features, improvements, and fixes — shipped continuously.
          </p>
        </div>

        <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border/60 md:before:left-[7px]">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="relative pl-10">
              <span
                className="absolute left-0 top-2 w-[15px] h-[15px] rounded-full border-2 border-background bg-foreground shadow-editorial"
                aria-hidden="true"
              />
              <div className="glass-panel rounded-2xl p-7">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="font-display text-2xl tracking-tight">{entry.title}</h2>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", TYPE_STYLES[entry.type])}>
                    {entry.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  {entry.version} · {entry.date}
                </p>
                <ul className="space-y-2.5">
                  {entry.body.map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button variant="gradient" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Start Writing Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
