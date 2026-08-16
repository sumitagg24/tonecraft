import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { DynamicLandingSections } from "@/components/landing/DynamicLandingSections";
import { publicPageMetadata, SITE_URL, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: SITE_TITLE,
  description:
    "Write Once. Speak Perfectly. Everywhere. ToneCraft is the AI communication platform that rewrites your messages for every platform, tone, and audience.",
  path: "",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/og.png`,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_TITLE,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function HomePage() {
  return (
    <div className="relative noise-bg">
      <main id="main-content">
        <Hero />
        <DynamicLandingSections />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
