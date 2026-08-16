import type { Metadata } from "next";
import { BlogArticleShell } from "@/components/blog/BlogArticleShell";
import { publicPageMetadata, SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "5 Email Templates ToneCraft Users Love (And Why They Work)",
  description:
    "We analyzed the most-saved email rewrites from our users. These five templates — from cold follow-ups to meeting summaries — account for a third of all saves.",
  path: "/blog/3",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "5 Email Templates ToneCraft Users Love (And Why They Work)",
      description:
        "We analyzed the most-saved email rewrites from our users. These five templates — from cold follow-ups to meeting summaries — account for a third of all saves.",
      datePublished: "2026-05-20",
      author: { "@type": "Person", name: "Maya Chen", jobTitle: "Growth Lead, ToneCraft" },
      publisher: { "@type": "Organization", name: "ToneCraft", url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/blog/3`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "5 Email Templates ToneCraft Users Love (And Why They Work)", item: `${SITE_URL}/blog/3` },
      ],
    },
  ],
};

export default function BlogPost3Page() {
  return (
    <main id="main-content">
    <BlogArticleShell
      category="Email"
      title="5 Email Templates ToneCraft Users Love (And Why They Work)"
      excerpt="We analyzed the most-saved email rewrites from our users. These five templates — from cold follow-ups to meeting summaries — account for a third of all saves."
      date="May 20, 2026"
      readTime="7 min read"
      author={{ name: "Maya Chen", role: "Growth Lead, ToneCraft", initials: "MC", gradient: "from-fuchsia-500 to-purple-600" }}
      tags={["email", "templates", "productivity"]}
      related={[
        { title: "How to Write Better LinkedIn Messages That Get Responses", href: "/blog/1", category: "LinkedIn Tips" },
        { title: "The Future of AI Communication Tools", href: "/blog/2", category: "AI & Writing" },
      ]}
    >
      <p>
        Every month we look at which outputs users save, star, or copy out of ToneCraft. Five email patterns show up again and again — and they are not what you would guess. Here they are, with the structure that makes each one work.
      </p>

      <h2>1. The cold outreach follow-up</h2>
      <p>
        Most cold emails fail because they are too long and ask for too much. The follow-up that converts is the opposite: short, specific, and low-friction.
      </p>
      <blockquote>
        <p><strong>Subject:</strong> Re: ToneCraft for Acme</p>
        <p>Hi Jordan —</p>
        <p>Bumping this once. If a 15-minute demo of our tone-aware rewriting tool would help you evaluate us before Q3, reply &quot;yes&quot; and I&apos;ll send a calendar link.</p>
        <p>Either way, thanks for considering us.</p>
        <p>— Maya</p>
      </blockquote>
      <p>
        One question, one clear next step, no hedging. The single reply-word lowers the effort threshold dramatically.
      </p>

      <h2>2. The post-meeting summary</h2>
      <p>
        Meeting summaries get skimmed for action items — so burying them at the bottom is a productivity crime. Lead with decisions, then actions, then notes.
      </p>
      <blockquote>
        <p><strong>Subject:</strong> Summary: Pricing discussion (Jun 2)</p>
        <ul>
          <li><strong>Decided:</strong> Move to per-seat pricing for the Pro tier.</li>
          <li><strong>Owner / due:</strong> You — draft the migration FAQ by Friday.</li>
          <li><strong>Next call:</strong> Thursday 10am to review the numbers.</li>
        </ul>
      </blockquote>

      <h2>3. The polite decline</h2>
      <p>
        Turning people down is a relationship skill. The template users save most: acknowledge the request, state the decline clearly (no &quot;maybe&quot;), and leave the door open on <em>your</em> terms.
      </p>
      <blockquote>
        <p>Hi Sam — thanks for thinking of me. I don&apos;t have capacity to take this on right now, and I&apos;d rather say that honestly than overpromise. If the timeline shifts, I&apos;ll reach out first.</p>
      </blockquote>

      <h2>4. The meeting request (with a reason)</h2>
      <p>
        &quot;Let&apos;s grab coffee sometime&quot; fails because it offers no reason to accept. The saved version names the topic and the value to the recipient:
      </p>
      <blockquote>
        <p>Hi Dana — I&apos;m rebuilding our onboarding emails and your work on lifecycle messaging came up twice in my research. Could I borrow 20 minutes this week to ask how you sequence that first-week series? Happy to share what we learn in return.</p>
      </blockquote>

      <h2>5. The apology / course-correction</h2>
      <p>
        The apology that lands is short, owns the specific miss, and states the fix. No &quot;if there was any confusion.&quot;
      </p>
      <blockquote>
        <p>Hi Marcus — I owe you an apology. I said the report would be with you by Tuesday and it wasn&apos;t. The corrected version is attached, and I&apos;ve set a recurring Monday reminder so this does not happen again.</p>
      </blockquote>

      <h2>Steal the structure, not the words</h2>
      <p>
        The reason these templates get saved is the structure: one clear ask, a respectful close, and no filler. Paste any rough draft into ToneCraft, pick the Email preset, and the engine will restructure it along these exact lines — in your voice, not ours.
      </p>
    </BlogArticleShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
