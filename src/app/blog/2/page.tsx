"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BlogPost2Page() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Industry
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            The Future of AI Communication Tools
          </h1>
          <p className="text-sm text-muted-foreground">June 1, 2025 — 4 min read</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          <div className="glass-panel rounded-2xl p-8 mb-8">
            <p className="text-muted-foreground leading-relaxed text-lg">
              AI is moving from autocomplete to communication partner. Tone-aware AI is the next frontier because it understands that how you say something matters as much as what you say.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Beyond grammar</h2>
            <p className="text-muted-foreground leading-relaxed">
              Today&apos;s AI tools fix spelling and suggest synonyms. Tomorrow&apos;s tools will understand audience, intent, and emotional nuance. ToneCraft is already there with tone presets that go far beyond grammar.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Platform-aware communication</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every platform has its own communication culture. WhatsApp is casual. LinkedIn is professional. Email is formal. AI that adapts to platform conventions automatically will replace generic messaging tools.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
