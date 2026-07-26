"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AboutPage() {
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
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
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
            About
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            We are ToneCraft
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            ToneCraft is an AI-powered communication platform that helps you express yourself perfectly across every platform and tone.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe that communication is everything. In a world where we write more than ever — from LinkedIn messages to customer emails to casual texts — the words we choose matter. ToneCraft gives everyone the power to communicate with precision, empathy, and style, regardless of their natural writing ability.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">How It Started</h2>
            <p className="text-muted-foreground leading-relaxed">
              ToneCraft was built out of frustration. After too many awkward Slack messages and misunderstood emails, our founders realized that everyone could benefit from a second pair of eyes — especially an AI that understands context, tone, and platform conventions. Today, ToneCraft helps thousands of professionals write better, faster, and with more confidence.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Clarity first.</strong> We strip away complexity to deliver communication that feels effortless.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Privacy matters.</strong> Your messages are yours. We never sell or share your data.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Accessible to all.</strong> Powerful AI doesn&apos;t have to be expensive or complicated.
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
