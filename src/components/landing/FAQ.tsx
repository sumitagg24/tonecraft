"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/marketing";

export function FAQ() {
  return (
    <section id="faq" className="relative py-28 md:py-36 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1fr_1.35fr] gap-12 md:gap-20">
          {/* Left: editorial title */}
          <div>
            <div className="eyebrow mb-6">FAQ</div>
            <h2 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight">
              Frequently
              <br />
              asked questions
            </h2>
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Anything else? Email us at{" "}
              <a href="mailto:support@tonecraft.ai" className="text-brand hover:underline">
                support@tonecraft.ai
              </a>{" "}
              and we&rsquo;ll get back to you within a day.
            </p>
          </div>

          {/* Right: accordion */}
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/50">
                <AccordionTrigger className="group flex-1 items-center gap-4 py-5 text-left text-base font-medium hover:no-underline [&>svg]:hidden text-foreground/90 hover:text-foreground transition-colors duration-200">
                  <span className="flex-1 pr-4 text-pretty">{faq.question}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:border-brand/50 group-data-[state=open]:text-brand">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
