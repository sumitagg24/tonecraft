import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt — lets crawlers see every intentionally public marketing page
 * and keeps them off the authenticated app, account, and admin surfaces.
 *
 * robots.txt is NOT a security mechanism: private routes are additionally
 * protected by Clerk auth (middleware) and carry noindex metadata so they can
 * never be indexed even if a crawler ignores the disallow.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Authenticated application (never indexable).
        "/chat",
        "/tools",
        "/docs",
        "/library",
        "/search",
        "/notifications",
        "/analytics",
        "/settings",
        "/billing",
        "/dashboard",
        "/calendar",
        "/tasks",
        "/notes",
        "/memory",
        "/marketplace",
        "/organization",
        "/automations",
        // Admin — internal only.
        "/admin",
        // Account / onboarding / auth utility pages (no content value).
        "/onboarding",
        "/sign-in",
        "/sign-up",
        "/login",
        "/register",
        // Token-gated user content and PWA utilities.
        "/share",
        "/offline",
        // Internal & API endpoints — never for crawlers.
        "/api",
        "/health",
        "/p",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
