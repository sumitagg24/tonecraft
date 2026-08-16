import type { Metadata } from "next";

/**
 * Single source of truth for the canonical production origin.
 *
 * The production domain is configured via NEXT_PUBLIC_APP_URL (set in the
 * deploy environment). When unset, we fall back to the established canonical
 * marketing origin (https://tonecraft.app) — never to a temporary *.vercel.app
 * URL. Everything that emits absolute URLs (metadataBase, canonical tags, OG,
 * sitemap, robots, llms.txt, JSON-LD) reads from here so they can never drift.
 */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://tonecraft.app").replace(/\/+$/, "");

export const SITE_NAME = "ToneCraft";
export const SITE_TITLE = "ToneCraft — AI Communication Platform";
export const SITE_DESCRIPTION =
  "Write Once. Speak Perfectly. Everywhere. ToneCraft rewrites your messages for every platform and tone.";

/** Shared branded social preview (1200×630). */
export const OG_IMAGE = "/og.png";

interface PublicPageMetadataOptions {
  title: string;
  description: string;
  /** URL path, e.g. "/pricing". "" for the homepage. */
  path: string;
  /** True for pages that must never be indexed (auth, private, utility). */
  noindex?: boolean;
}

/**
 * Build complete, consistent metadata for a public page: unique title,
 * unique description, canonical URL, Open Graph and Twitter card — all
 * absolute, all rooted at the canonical origin.
 */
export function publicPageMetadata({
  title,
  description,
  path,
  noindex = false,
}: PublicPageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = [{ url: `${SITE_URL}${OG_IMAGE}`, width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}${OG_IMAGE}`],
    },
    ...(noindex
      ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } }
      : {}),
  };
}
