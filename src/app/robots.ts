import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tonecraft.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account/workspace data and API endpoints are not for crawlers.
      disallow: [
        "/api/",
        "/chat/",
        "/library",
        "/tools",
        "/search",
        "/notifications",
        "/analytics",
        "/settings",
        "/billing",
        "/onboarding",
        "/share/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
