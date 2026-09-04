import type { Metadata } from "next";
import { headers } from "next/headers";
import { Pricing } from "@/components/landing/Pricing";
import { publicPageMetadata, SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Pricing — ToneCraft AI Writing Plans",
  description:
    "Start free with 5 AI generations a day. Upgrade to Pro for unlimited rewrites, custom personas, and a 16K context window — cancel anytime.",
  path: "/pricing",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/pricing/#webpage`,
      url: `${SITE_URL}/pricing`,
      name: "ToneCraft Pricing — AI Writing Plans",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "ToneCraft Free",
      description: "5 AI generations per day, all tone presets",
      url: `${SITE_URL}/pricing`,
      eligibleRegion: { "@type": "Country", name: "Worldwide" },
    },
    {
      "@type": "Offer",
      price: "5",
      priceCurrency: "USD",
      name: "ToneCraft Pro",
      description: "Unlimited rewrites, custom personas, 16K context window",
      url: `${SITE_URL}/pricing`,
      eligibleRegion: { "@type": "Country", name: "Worldwide" },
    },
  ],
};

export default async function PricingPage() {
  // Detect country from Vercel's edge headers for localized pricing.
  // Falls back to "OTHERS" (Dodo infers from IP at checkout time).
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "OTHERS";

  return (
    <main id="main-content" className="relative noise-bg min-h-screen">
      <div className="pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto px-6 text-center mb-4">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Pricing that scales with you
          </h1>
        </div>
        <Pricing country={country} />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
