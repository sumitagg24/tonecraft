import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SOLUTIONS } from "@/lib/marketing";

/**
 * XML sitemap — every entry is a real, public, indexable marketing page.
 * Authenticated routes, API routes, admin routes, auth pages, and
 * token-gated shared pages are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/features", priority: 0.9, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/solutions", priority: 0.8, changeFrequency: "monthly" },
    { path: "/demo", priority: 0.6, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/help", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
    { path: "/changelog", priority: 0.4, changeFrequency: "weekly" },
    { path: "/roadmap", priority: 0.4, changeFrequency: "monthly" },
    { path: "/status", priority: 0.3, changeFrequency: "daily" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  ];

  const solutionPages = SOLUTIONS.map((s) => ({
    url: `${SITE_URL}/solutions/${s.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogPosts = ["/blog/1", "/blog/2", "/blog/3"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...solutionPages,
    ...blogPosts,
  ];
}
