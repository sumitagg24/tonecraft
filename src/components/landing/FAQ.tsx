"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What AI models does ToneCraft use?",
    answer:
      "ToneCraft uses Groq (Llama 3.3 70B, Llama 3.1 8B) and Google Gemini 2.5 Flash on the free tier. Pro users get access to GPT-4o and Claude 3.7 Sonnet via OpenRouter.",
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
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Frequently asked questions</h2>
          <p className="text-muted-foreground text-sm">
            Anything else? Email us at{" "}
            <a href="mailto:support@tonecraft.ai" className="text-primary hover:underline">
              support@tonecraft.ai
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/60 py-1">
              <AccordionTrigger className="text-left text-sm font-medium py-4 hover:text-primary hover:no-underline transition-colors duration-200 group text-pretty">
                <span className="flex-1 pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
