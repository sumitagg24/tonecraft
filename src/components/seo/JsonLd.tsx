import React from "react";

export interface JsonLdProps {
  type?: "Organization" | "SoftwareApplication" | "WebSite";
  data?: Record<string, unknown>;
}

export function JsonLd({ type = "SoftwareApplication", data }: JsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tonecraft.app";

  let schema: Record<string, unknown> = {};

  if (type === "SoftwareApplication") {
    schema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ToneCraft",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, macOS, Windows, Linux, iOS, Android",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1250",
      },
      ...data,
    };
  } else if (type === "Organization") {
    schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ToneCraft AI",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: [
        "https://twitter.com/tonecraft",
        "https://github.com/tonecraft",
      ],
      ...data,
    };
  } else {
    schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ToneCraft",
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
      ...data,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
