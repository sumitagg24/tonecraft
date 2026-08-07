"use client";
import { motion } from "framer-motion";
import { sectionReveal, sectionItem, sectionChip } from "@/styles/motion";
import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote: "ToneCraft has fundamentally transformed how our executive leadership team communicates across global channels.",
    author: "Eleanor Vance",
    role: "VP of Communications",
    company: "Vanguard Publishing",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "t2",
    quote: "The nuance and precision of tone modulation is unlike any AI tool I've used before. It actually understands editorial nuance.",
    author: "Julian Thorne",
    role: "Senior Managing Editor",
    company: "Chronicle Media",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "t3",
    quote: "I save hours every single day turning raw notes into impeccably crafted client proposals and public updates.",
    author: "Sophia Mercer",
    role: "Principal Strategist",
    company: "Apex Design Co",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-28 md:py-36 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-16"
        >
          <motion.div
            variants={sectionChip}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Quote className="w-3.5 h-3.5" />
            Editorial Stories
          </motion.div>
          <motion.h2 variants={sectionItem} className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Trusted by master communicators
          </motion.h2>
          <motion.p variants={sectionItem} className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Discover how leaders, editors, and creators elevate every sentence with ToneCraft.
          </motion.p>
        </motion.div>

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.id}
              variants={sectionItem}
              whileHover={{ y: -2 }}
              className="group bg-background rounded-3xl p-8 border border-border/60 shadow-editorial flex flex-col justify-between transition-all duration-300 hover:border-border/80 hover:shadow-editorial-lg"
            >
              <div className="mb-8">
                <Quote className="w-8 h-8 text-foreground/20 mb-4 group-hover:text-foreground/40 transition-colors duration-300" />
                <p className="font-display text-xl text-foreground leading-snug italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-6 border-t border-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-11 h-11 rounded-full object-cover border border-border/60"
                />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{t.author}</h4>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
