"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    id: "marketer",
    label: "Marketer",
    emoji: "📊",
    color: "#6366f1",
    prompt: "Write a product launch email",
    expectation: "Highlight features, benefits, and urgency",
    output: "Subject: Introducing ToneCraft — Your AI Communication Partner\n\nHi [Name],\n\nWe're excited to announce ToneCraft: the AI platform that transforms how your team communicates across every channel.\n\nWith ToneCraft, you can:\n• Write once, publish everywhere\n• Maintain brand voice across all platforms\n• Reduce email drafting time by 60%\n\nJoin thousands of professionals who've already upgraded their communication workflow.\n\nStart your free trial today →\n\nThe ToneCraft Team",
    features: ["Multi-platform", "Brand voice", "Templates"],
  },
  {
    id: "founder",
    label: "Founder",
    emoji: "🚀",
    color: "#f97316",
    prompt: "Draft a cold outreach message to investors",
    expectation: "Professional, concise, value-driven",
    output: "Hi [Name],\n\nI've been following your work with [Portfolio Company] and was impressed by how you think about communication tools.\n\nAt ToneCraft, we're building the AI layer for business communication — one platform that adapts every message for the right channel, tone, and audience.\n\nWe're seeing 3x faster response times and 40% higher engagement with our early users.\n\nWould you be open to a 15-min call this week to share what we're building?\n\nBest,\n[Name]\nCo-Founder, ToneCraft",
    features: ["Cold outreach", "Investor updates", "Team comms"],
  },
  {
    id: "freelancer",
    label: "Freelancer",
    emoji: "🎨",
    color: "#10b981",
    prompt: "Send a follow-up to a client who hasn't paid",
    expectation: "Firm but polite, maintains relationship",
    output: "Hi [Client Name],\n\nHope you're doing well! I wanted to gently follow up on invoice #1234, which was due on [Date].\n\nI understand things get busy, so no worries at all — just wanted to make sure it didn't slip through the cracks.\n\nLet me know if there's anything I can clarify about the invoice or if you need to adjust the payment schedule.\n\nThanks so much for your business — it's a pleasure working with you!\n\nBest,\n[Your Name]",
    features: ["Client comms", "Invoice follow-ups", "Proposals"],
  },
  {
    id: "writer",
    label: "Writer",
    emoji: "✍️",
    color: "#a855f7",
    prompt: "Turn a rough draft into a polished article intro",
    expectation: "Engaging hook, clear structure, consistent voice",
    output: "The average professional spends 28% of their workday reading and answering emails.\n\nThat's 11 hours a week. 528 hours a year. Almost an entire month dedicated to communication.\n\nBut the problem isn't just volume — it's context switching. A message that works on Slack feels stiff in an email. A casual WhatsApp text would embarrass you on LinkedIn.\n\nThis is the communication gap, and it costs businesses more than they realize.\n\nEnter ToneCraft: the first AI platform purpose-built to bridge this gap — not by writing for you, but by adapting what you already want to say for every platform and audience you communicate with.",
    features: ["Content writing", "Editing", "Tone adjustment"],
  },
  {
    id: "sales",
    label: "Sales",
    emoji: "💼",
    color: "#f43f5e",
    prompt: "Respond to a prospect who says 'not interested'",
    expectation: "Respectful objection handling, leaves door open",
    output: "Hi [Name],\n\nThanks for getting back to me — I appreciate the honesty.\n\nI totally understand that timing might not be right. If I may ask, is it the solution itself or just the timing that's not a fit?\n\nEither way, I'd love to leave the door open. If anything changes or you'd like to explore how ToneCraft could help your team communicate more effectively, I'm just an email away.\n\nWishing you and your team a great week ahead!\n\nBest,\n[Your Name]",
    features: ["Follow-ups", "Objection handling", "Proposals"],
  },
];

export function RoleSelector() {
  const [activeRole, setActiveRole] = useState(ROLES[0].id);

  const currentRole = ROLES.find((r) => r.id === activeRole)!;

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            For every communicator
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Tailored to your world
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Select your role to see how ToneCraft adapts to your specific communication needs.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {ROLES.map((role) => (
            <motion.button
              key={role.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveRole(role.id)}
              className={cn(
                "px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                activeRole === role.id
                  ? "text-white shadow-md"
                  : "glass-panel text-muted-foreground hover:text-foreground hover:border-white/20"
              )}
              style={activeRole === role.id ? { backgroundColor: role.color } : {}}
            >
              <span className="text-base">{role.emoji}</span>
              {role.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="glass-panel-strong rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentRole.color }} />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Scenario
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{currentRole.prompt}</h3>
                  <p className="text-sm text-muted-foreground">{currentRole.expectation}</p>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Features you&apos;ll use most
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentRole.features.map((f) => (
                      <span
                        key={f}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: `${currentRole.color}15`,
                          color: currentRole.color,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="glass-panel-strong rounded-2xl p-5 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{currentRole.emoji}</span>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        AI-Generated Output
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${currentRole.color}15`,
                        color: currentRole.color,
                      }}
                    >
                      {currentRole.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {currentRole.output}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
