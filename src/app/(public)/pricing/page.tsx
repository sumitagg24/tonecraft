import type { Metadata } from "next";
import { Pricing } from "@/components/landing/Pricing";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Pricing — ToneCraft AI Writing Plans",
  description:
    "Start free with 50 AI generations a day. Upgrade to Pro for unlimited rewrites, custom personas, and a 16K context window — cancel anytime.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto px-6 text-center mb-4">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Pricing that scales with you
          </h1>
        </div>
        <Pricing />
      </div>
    </main>
  );
}
