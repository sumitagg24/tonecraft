"use client";
import { useRef, useState, useMemo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What AI models does ToneCraft use?",
    answer:
      "ToneCraft uses Groq (Llama 3.1 70B, Mixtral 8x7B) and Google Gemini 1.5 Flash on the free tier — all fast and free. Pro users get access to GPT-4o and Claude 3.5 Sonnet via OpenRouter.",
  },
  {
    question: "Is the free tier really free?",
    answer:
      "Yes. The free tier includes 50 messages per day, all 9 tone presets, and file uploads (up to 5/day). No credit card required.",
  },
  {
    question: "How does tone control work?",
    answer:
      "Each tone preset includes a carefully crafted system prompt that shapes the AI's communication style. Professional uses formal language with clear structure. Casual uses conversational, friendly language. The tone is applied to every message.",
  },
  {
    question: "Can I create custom tones?",
    answer:
      "Pro users can create unlimited custom personas with their own system prompts. Free users get access to all 9 built-in tones.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. API keys for AI providers are encrypted and never exposed. We don't sell or share your data.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. Cancel anytime from your billing settings. You'll keep Pro access until the end of your billing period. No cancellation fees.",
  },
  {
    question: "Is there a waitlist for early access?",
    answer:
      "ToneCraft is currently in Early Access. You can start using the free tier immediately — no waitlist needed. Some advanced features are rolling out gradually to ensure quality.",
  },
];

export function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const filteredFAQs = useMemo(
    () =>
      searchQuery
        ? faqs.filter((faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : faqs,
    [searchQuery]
  );

  return (
    <section id="faq" ref={ref} className="relative py-32">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-sm">
            Anything else? Email us at{" "}
            <a href="mailto:support@tonecraft.ai" className="text-primary hover:underline">
              support@tonecraft.ai
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchActive(true);
            }}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setTimeout(() => setSearchActive(false), 200)}
            className="search-input"
            aria-label="Search FAQs"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <span className="text-[10px] text-muted-foreground/60">
                {filteredFAQs.length} result{filteredFAQs.length !== 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <p className="text-sm text-muted-foreground">No FAQs match your search.</p>
            </motion.div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              <AnimatePresence>
                {filteredFAQs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    <AccordionItem
                      value={`item-${i}`}
                      className="border-b border-border/60 py-1"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium py-4 hover:text-primary hover:no-underline transition-colors duration-200 group text-pretty">
                        <span className="flex-1 pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {faq.answer}
                        </motion.div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Accordion>
          )}
        </motion.div>
      </div>
    </section>
  );
}
