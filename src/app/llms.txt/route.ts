import { SITE_URL } from "@/lib/site";

/**
 * /llms.txt — an optional AI-discoverability layer (llmstxt.org proposal).
 * Concise, accurate summary of what ToneCraft is, linking only to public
 * marketing pages. No private routes, internal architecture, or secrets.
 */
export function GET() {
  const body = `# ToneCraft

> Write Once. Speak Perfectly. Everywhere.

ToneCraft is an AI communication platform that rewrites your messages for
every platform and tone. It applies platform-specific conventions (Email,
LinkedIn, Slack, WhatsApp, and more), supports 10 built-in tone personas (or
custom personas on Pro), and translates across 50+ languages. It also offers
grammar/style cleanup, templates, and a knowledge-grounded chat.

## Key pages

- [Homepage](${SITE_URL}/)
- [Features](${SITE_URL}/features)
- [Solutions](${SITE_URL}/solutions)
- [Pricing](${SITE_URL}/pricing)
- [Interactive demo](${SITE_URL}/demo)
- [Documentation](${SITE_URL}/help)
- [Blog](${SITE_URL}/blog)
- [FAQ](${SITE_URL}/faq)
- [Changelog](${SITE_URL}/changelog)
- [Roadmap](${SITE_URL}/roadmap)
- [Privacy policy](${SITE_URL}/privacy)
- [Terms of service](${SITE_URL}/terms)

## Solution pages

- [Students](${SITE_URL}/solutions/students)
- [Marketing](${SITE_URL}/solutions/marketing)
- [Sales](${SITE_URL}/solutions/sales)
- [Founders](${SITE_URL}/solutions/founders)
- [Recruiters](${SITE_URL}/solutions/recruiters)
- [Content creators](${SITE_URL}/solutions/content-creators)
- [Businesses](${SITE_URL}/solutions/businesses)
- [Agencies](${SITE_URL}/solutions/agencies)
- [Developers](${SITE_URL}/solutions/developers)
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
