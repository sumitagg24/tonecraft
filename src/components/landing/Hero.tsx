"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import FlowField from "@/components/ui/effects/FlowField";

export function Hero() {
  return (
    <FlowField theme="aurora" density="medium" className="min-h-[calc(100vh-4rem)] pt-16 pb-24">
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel-strong mb-7"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs md:text-sm font-medium text-foreground/80">
            AI tone transformation · free to start
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.47, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]"
        >
          Write once.
          <br />
          Speak <span className="aurora-text">perfectly</span>, everywhere.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.56, ease: "easeOut" }}
          className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed"
        >
          ToneCraft rewrites your message for the right tone and platform —
          professional emails, friendly DMs, sharp LinkedIn posts — in one click.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
        >
          <Button size="xl" className="w-full sm:w-auto text-base px-8 shadow-glow-lg premium-btn" asChild>
            <Link href="/chat">
              Start Writing Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="xl" variant="glass" className="w-full sm:w-auto text-base px-8" asChild>
            <Link href="#demo">See it in action</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.74, ease: "easeOut" }}
          className="text-xs md:text-sm text-muted-foreground/70"
        >
          Free plan · No credit card · 50 messages a day
        </motion.p>
      </div>
    </FlowField>
  );
}
