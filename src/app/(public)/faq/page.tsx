import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/marketing";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "FAQ — ToneCraft",
  description:
    "Answers about ToneCraft's AI writing engine, free tier, credits, custom personas, data security, and subscriptions.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-24">

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            FAQ
          </div>
          <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-6">Frequently asked questions</h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Quick answers to the questions we hear most. Anything else? Email{" "}
            <a href="mailto:support@tonecraft.ai" className="text-primary hover:underline">
              support@tonecraft.ai
            </a>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/60 py-1">
              <AccordionTrigger className="text-left text-sm font-medium py-4 hover:text-primary hover:no-underline transition-colors duration-200 group text-pretty">
                <span className="flex-1 pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-14 text-center">
          <Button variant="gradient" asChild>
            <Link href="/sign-up?redirect_url=%2Fchat">Start Writing Free</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
