"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";

export function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-80px" });

  return (
    <section ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-4">
        <div ref={headingRef} className="text-center mb-16">
          <motion.div
            variants={sectionChip}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Early Access
          </motion.div>
          <motion.h2
            variants={sectionItem}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-3xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Join the first wave
          </motion.h2>
          <motion.p
            variants={sectionItem}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            We&apos;re in Early Access. Your feedback will help shape the future of communication.
          </motion.p>
        </div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-surface/50 border-border/40 hover:border-white/10 transition-all duration-300 hover:shadow-card group overflow-hidden">
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/30 mx-auto mt-0 rounded-b-full" />
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-6 max-w-sm mx-auto">
                  Testimonials are being written by our first users right now.
                  Be among the first to share your experience.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/chat">Share Your Experience</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
