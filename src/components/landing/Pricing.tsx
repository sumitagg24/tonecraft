"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { PRICING_TIERS, type PricingTier } from "@/lib/constants";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { openPaddleCheckoutByPrice } from "@/lib/paddle-client";
import { sectionReveal, sectionItem } from "@/styles/motion";
import { Minus } from "lucide-react";
import { toast } from "sonner";

const COMPARISON_ROWS: { feature: string; tiers: (string | boolean)[] }[] = [
  { feature: "AI Messages", tiers: ["50 / day", "Unlimited", "Unlimited"] },
  { feature: "Knowledge Base", tiers: [true, true, true] },
  { feature: "Workspace", tiers: [true, true, true] },
  { feature: "Priority Models", tiers: [false, true, true] },
  { feature: "Team Collaboration", tiers: [false, false, true] },
];

interface Props {
  country?: string;
}

export function Pricing({ country = "OTHERS" }: Props) {
  const { isSignedIn, user } = useUser();
  const [annual, setAnnual] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  const { prices, loading: pricesLoading } = usePaddlePrices(paddle, country);

  // Initialize Paddle.js for PricePreview only — no checkout settings needed.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return;
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production",
    }).then((p) => p && setPaddle(p));
  }, []);

  // Open Paddle checkout overlay directly for the selected tier.
  // No server transaction needed — Paddle handles everything client-side.
  const handleSubscribe = (tier: PricingTier) => {
    const priceId = annual ? tier.priceId.year : tier.priceId.month;
    openPaddleCheckoutByPrice(priceId, {
      customerEmail: user?.emailAddresses?.[0]?.emailAddress,
      onSuccess: () => {
        window.location.href = "/welcome";
      },
      onPaymentError: () => {
        toast.error("Payment failed. Please check your card details and try again.");
      },
    });
  };

  // Starter goes to sign-up, Pro and Advanced open checkout directly.
  const ctaHref = (tierName: string): string => {
    if (tierName === "Starter") {
      return "/sign-up?redirect_url=%2Fchat";
    }
    return "#"; // handled by handleSubscribe
  };

  /**
   * Get the formatted price for a tier. Uses PricePreview data when available,
   * falls back to the hardcoded USD price for the free tier or if Paddle
   * hasn't loaded yet.
   */
  const getFormattedPrice = (tier: (typeof PRICING_TIERS)[number]): string => {
    if (tier.price === 0) return "$0";
    if (!tier.priceId?.month) return `$${tier.price}`;

    const priceId = annual ? tier.priceId.year : tier.priceId.month;
    const formatted = prices[priceId];

    if (formatted) return formatted;
    // Fallback: show hardcoded USD with 20% annual discount
    const fallback = annual ? Math.floor(tier.price * 0.8) : tier.price;
    return `$${fallback}`;
  };

  return (
    <section id="pricing" className="relative py-28 md:py-36 overflow-hidden bg-muted/20 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background border border-border/60 text-foreground text-xs font-medium mb-4 shadow-editorial">
            Transparent Pricing
          </div>
          <motion.h2 variants={sectionItem} className="font-display text-4xl md:text-6xl tracking-tight mb-4">
            Start free, scale seamlessly
          </motion.h2>
          <motion.p variants={sectionItem} className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Simple, honest plans designed for individuals, power users, and enterprise organizations.
          </motion.p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-background border border-border/60 shadow-editorial">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
                !annual ? "bg-foreground text-background shadow-editorial" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
                annual ? "bg-foreground text-background shadow-editorial" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual (20% Off)
            </button>
          </div>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PRICING_TIERS.map((tier, idx) => {
            const formattedPrice = getFormattedPrice(tier);
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`
                  relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300
                  ${tier.popular
                    ? "bg-background border-2 border-foreground shadow-editorial-lg scale-[1.02] z-10"
                    : "bg-background border border-border/60 shadow-editorial hover:border-border"
                  }
                `}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-foreground text-background text-[11px] font-semibold tracking-wider uppercase shadow-editorial">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="font-display text-3xl text-foreground mb-2">{tier.name}</h3>
                  <p className="text-xs text-muted-foreground mb-6 min-h-[36px]">{tier.description}</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-display text-5xl font-medium tracking-tight text-foreground">
                      {pricesLoading && tier.price > 0 ? (
                        <Loader2 className="w-8 h-8 animate-spin inline" />
                      ) : (
                        formattedPrice
                      )}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">/month</span>
                    )}
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-xs text-foreground/80 font-medium">
                        <Check className="w-4 h-4 text-foreground shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {tier.name === "Starter" ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-2xl h-12 text-xs font-medium shadow-none"
                    asChild
                  >
                    <Link href={ctaHref(tier.name)}>
                      {tier.cta}
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full rounded-2xl h-12 text-xs font-medium shadow-none"
                    onClick={() => handleSubscribe(tier)}
                    disabled={!paddle}
                  >
                    {tier.cta}
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ── Detailed Comparison Table ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 rounded-3xl bg-background border border-border/60 shadow-editorial overflow-hidden"
        >
          <div className="px-6 md:px-8 pt-8 pb-6 border-b border-border/40">
            <h3 className="font-display text-2xl md:text-3xl tracking-tight mb-2">Compare plans</h3>
            <p className="text-sm text-muted-foreground">Every plan includes the core ToneCraft writing engine.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left font-medium text-muted-foreground px-6 md:px-8 py-4 text-xs uppercase tracking-wider">
                    Feature
                  </th>
                  {["Free", "Pro", "Enterprise"].map((name, i) => (
                    <th
                      key={name}
                      className={`text-center font-semibold px-4 py-4 text-sm ${i === 1 ? "bg-foreground/5 text-foreground" : "text-foreground/80"}`}
                    >
                      {name}
                      {i === 1 && <span className="block text-[10px] font-medium text-foreground/50 mt-0.5 uppercase tracking-wide">Most popular</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={row.feature} className={`border-b border-border/30 ${idx % 2 === 0 ? "bg-muted/10" : ""}`}>
                    <td className="px-6 md:px-8 py-4 font-medium text-foreground/90">{row.feature}</td>
                    {row.tiers.map((value, i) => (
                      <td key={i} className={`text-center px-4 py-4 ${i === 1 ? "bg-foreground/5" : ""}`}>
                        {value === true ? (
                          <Check className="w-4 h-4 mx-auto text-emerald-500" />
                        ) : value === false ? (
                          <Minus className="w-4 h-4 mx-auto text-muted-foreground/40" />
                        ) : (
                          <span className="font-semibold text-foreground">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
