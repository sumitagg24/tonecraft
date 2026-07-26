"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useTiltEffect } from "@/hooks/use-tilt-effect";

function AnimatedPrice({ price, annual }: { price: number; annual: boolean }) {
  const displayPrice = annual ? Math.round(price * 10) : price;

  return (
    <div className="overflow-hidden">
      <motion.span
        key={`${displayPrice}-${annual}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="inline-block"
      >
        {price === 0 ? "Free" : `$${displayPrice}`}
      </motion.span>
      {price > 0 && (
        <span className="text-muted-foreground text-sm">
          /{annual ? "year" : "month"}
        </span>
      )}
    </div>
  );
}

function TiltedPricingCard({ tier, index, inView, annual }: {
  tier: typeof PRICING_TIERS[0];
  index: number;
  inView: boolean;
  annual: boolean;
}) {
  const tilt = useTiltEffect({ max: 3, scale: 1.003 });

  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn("relative flex", tier.popular && "md:-mt-3 md:mb-[-12px]")}
    >
      <Card
        className={cn(
          "h-full w-full flex flex-col transition-all duration-300 hover:border-white/10",
          tier.popular
            ? "border-primary shadow-card ring-1 ring-primary/20"
            : "bg-surface/50 hover:shadow-card"
        )}
      >
        {tier.popular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <Badge className="shadow-glow text-xs font-semibold px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black border-0">
              Most Popular
            </Badge>
          </div>
        )}

        <CardHeader className="flex-1">
          <CardTitle className="text-lg">{tier.name}</CardTitle>
          <CardDescription className="text-xs">{tier.description}</CardDescription>

          <div className="pt-5 pb-2">
            <div className="flex items-baseline gap-1">
              <AnimatedPrice price={tier.price} annual={annual} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-2.5 flex-1 mb-6">
            {tier.features.map((feature) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2.5 text-sm"
              >
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <Button
            className={cn(
              "w-full transition-all duration-200 premium-btn",
              tier.popular && "shadow-glow hover:shadow-glow-lg"
            )}
            variant={tier.popular ? "default" : "outline"}
            size="lg"
          >
            {tier.cta}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Pricing() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [annual, setAnnual] = useState(false);
  // ponytail: hoveredTier state removed since UpgradeAnimation component was unused

  return (
    <section id="pricing" ref={ref} className="relative py-32">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-4">
            Simple pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Start free, upgrade when you need more
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No hidden fees. No surprise charges. Cancel anytime.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                annual ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <motion.div
                animate={{ x: annual ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute top-1 w-5 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {annual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full"
              >
                Save ~17%
              </motion.span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_TIERS.map((tier, i) => (
            <TiltedPricingCard
              key={tier.name}
              tier={tier}
              index={i}
              inView={inView}
              annual={annual}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
