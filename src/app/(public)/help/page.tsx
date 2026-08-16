import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, Coins, Users, Cpu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Documentation — ToneCraft",
  description:
    "Getting-started guides, billing and credits explained, workspace tips, and AI provider details for ToneCraft.",
  path: "/help",
});

const SECTIONS = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    body: [
      "ToneCraft rewrites any message to match the tone and platform you need — from a professional email to a casual LinkedIn post.",
      "1. Create a free account (no credit card required).",
      "2. Click New Chat and type a message the way you'd naturally say it.",
      "3. Pick a tone (Professional, Friendly, Funny…) and a platform (Email, LinkedIn, WhatsApp…).",
      "4. Press Enter — ToneCraft streams back the perfect version. Copy and send.",
    ],
  },
  {
    id: "billing",
    icon: CreditCard,
    title: "Billing",
    body: [
      "The Free tier includes 50 AI generations/day with all tone presets.",
      "Pro ($6/mo) unlocks unlimited messages, custom personas, and a 16K context window.",
      "Manage your plan, invoices, and payment method in Settings → Billing.",
    ],
  },
  {
    id: "credits",
    icon: Coins,
    title: "Credits",
    body: [
      "Every AI request consumes credits based on the model used (larger models cost more).",
      "You can see your remaining credits and usage history in Settings and the Analytics page.",
      "Hitting a credit or rate limit shows a clear upgrade prompt — no silent failures.",
    ],
  },
  {
    id: "workspaces",
    icon: Users,
    title: "Workspaces",
    body: [
      "Workspaces let teams share projects, knowledge, and chats.",
      "Invite members, assign roles (Owner / Admin / Member / Viewer), and control permissions.",
      "Enterprise plans add SSO, audit logs, and security policies.",
    ],
  },
  {
    id: "ai-providers",
    icon: Cpu,
    title: "AI Engine",
    body: [
      "ToneCraft routes every request through a resilient AI engine that automatically picks the right model for the job — no manual configuration needed.",
      "The free tier uses fast, low-cost models; Pro unlocks our most capable frontier models.",
      "If one backend is unavailable, the engine automatically fails over to another so your writing never stops.",
    ],
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "FAQ",
    body: [
      "Is my data private? Yes — messages are encrypted in transit and at rest, and we never sell your data.",
      "Can I cancel anytime? Yes — cancel from Billing and keep Pro until the end of the period.",
      "Need more help? Email support@tonecraft.ai and we'll get back to you within one business day.",
    ],
  },
];

export default function HelpPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Documentation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">ToneCraft Docs</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Everything you need to get the most out of ToneCraft — from your first message to enterprise workflows.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="glass-panel rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-2.5">
                {section.body.map((line, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="gradient" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Start Writing Free</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
