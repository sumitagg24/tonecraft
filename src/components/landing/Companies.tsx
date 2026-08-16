"use client";
import { motion } from "framer-motion";

const COMPANIES = [
  "Acme Corp",
  "Northwind",
  "Globex",
  "Initech",
  "Umbrella",
  "Stark Ind.",
  "Wayne Ent.",
  "Hooli",
];

export function Companies() {
  return (
    <section className="relative py-16 md:py-20 border-t border-border/30">
      <div className="max-w-6xl mx-auto px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-10"
        >
          Built for teams of every size
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="text-sm md:text-base font-semibold tracking-tight text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-200 select-none"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
