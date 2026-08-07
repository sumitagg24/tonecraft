"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-foreground text-background rounded-3xl p-10 md:p-16 shadow-editorial-lg relative overflow-hidden"
        >
          {/* Subtle Background Geometry */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <PenTool className="w-96 h-96 stroke-background" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-6">
              Write once. Speak perfectly, everywhere.
            </h2>
            <p className="text-background/70 text-base md:text-lg mb-10 leading-relaxed font-light">
              Join thousands of communicators elevating their message across every medium.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base px-8 rounded-2xl h-14 bg-background text-foreground hover:bg-background/90 font-medium shadow-editorial"
                asChild
              >
                <Link href="/sign-up?redirect_url=%2Fchat">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
