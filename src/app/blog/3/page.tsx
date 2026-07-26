"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BlogPost3Page() {
  return (
    <div className="relative noise-bg min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium mb-4">
            Templates
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            5 Email Templates ToneCraft Users Love
          </h1>
          <p className="text-sm text-muted-foreground">May 20, 2025 — 6 min read</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          <div className="glass-panel rounded-2xl p-8 mb-8">
            <p className="text-muted-foreground leading-relaxed text-lg">
              Every ToneCraft user has a favorite transformation. We collected the most-loved email rewrites and broke down what makes them work.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">1. The cold outreach follow-up</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most cold emails fail because they are too long. The best follow-ups are short, specific, and polite. Users love how ToneCraft turns rambling drafts into crisp, actionable follow-ups.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">2. The post-meeting summary</h2>
            <p className="text-muted-foreground leading-relaxed">
              Summaries should be scannable. Bullet points, clear action items, and a friendly close. ToneCraft&apos;s Corporate and Professional tones excel here.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Try these templates</h2>
            <p className="text-muted-foreground leading-relaxed">
              Open ToneCraft and paste any rough draft. Select Professional or Email tone and see your message transform instantly.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
