"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function BlogPost1Page() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4">
            LinkedIn Tips
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            How to Write Better LinkedIn Messages That Get Responses
          </h1>
          <p className="text-sm text-muted-foreground">June 15, 2025 — 5 min read</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-none"
        >
          <div className="glass-panel rounded-2xl p-8 mb-8">
            <p className="text-muted-foreground leading-relaxed text-lg">
              LinkedIn is not just a resume platform — it&apos;s a communication channel. The messages you send here shape professional relationships. Here is how to make every message count.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Start with context</h2>
            <p className="text-muted-foreground leading-relaxed">
              People are busy. If your message does not explain why you are reaching out in the first sentence, it will be ignored. Reference a shared connection, a recent post, or a mutual interest immediately.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Keep it concise</h2>
            <p className="text-muted-foreground leading-relaxed">
              LinkedIn messages are read on phones. Short paragraphs, clear ask, and a polite close go a long way. ToneCraft&apos;s Professional and LinkedIn presets are designed to hit this balance automatically.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Try it yourself</h2>
            <p className="text-muted-foreground leading-relaxed">
              Use ToneCraft to transform casual drafts into polished LinkedIn messages in one click. No more staring at a blank screen wondering how to start.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
