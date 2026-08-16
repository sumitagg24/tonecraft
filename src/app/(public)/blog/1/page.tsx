import type { Metadata } from "next";
import Link from "next/link";
import { BlogArticleShell } from "@/components/blog/BlogArticleShell";
import { publicPageMetadata, SITE_URL } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "How to Write Better LinkedIn Messages That Get Responses",
  description:
    "Most LinkedIn messages are ignored within three seconds. Here is the exact structure we use to write outreach that gets replied to — with real before-and-after examples.",
  path: "/blog/1",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "How to Write Better LinkedIn Messages That Get Responses",
      description:
        "Most LinkedIn messages are ignored within three seconds. Here is the exact structure we use to write outreach that gets replied to — with real before-and-after examples.",
      datePublished: "2026-06-15",
      author: { "@type": "Person", name: "Priya Sharma", jobTitle: "Head of Content, ToneCraft" },
      publisher: { "@type": "Organization", name: "ToneCraft", url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/blog/1`,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: "How to Write Better LinkedIn Messages That Get Responses", item: `${SITE_URL}/blog/1` },
      ],
    },
  ],
};

export default function BlogPost1Page() {
  return (
    <main id="main-content">
      <BlogArticleShell
        category="LinkedIn Tips"
        title="How to Write Better LinkedIn Messages That Get Responses"
        excerpt="Most LinkedIn messages are ignored within three seconds. Here is the exact structure we use to write outreach that gets replied to — with real before-and-after examples."
        date="June 15, 2026"
        readTime="6 min read"
        author={{ name: "Priya Sharma", role: "Head of Content, ToneCraft", initials: "PS", gradient: "from-emerald-500 to-teal-600" }}
        tags={["linkedin", "outreach", "networking"]}
        related={[
          { title: "5 Email Templates ToneCraft Users Love (And Why They Work)", href: "/blog/3", category: "Email" },
          { title: "The Future of AI Communication Tools", href: "/blog/2", category: "AI & Writing" },
        ]}
      >
        <p>
          We tracked the behavior of every message sent through ToneCraft&apos;s LinkedIn preset over a three-month window. The data was humbling: the single biggest predictor of a reply was not how impressive the sender sounded — it was how quickly the recipient understood <em>why they were being contacted</em>.
        </p>

        <p>
          This is not about tricking anyone. It is about respecting the reader&apos;s attention. Below is the structure that consistently outperforms, plus examples you can adapt today.
        </p>

        <h2>Start with context, not a compliment</h2>
        <p>
          The most common mistake is opening with a generic compliment: <em>&quot;I love your profile!&quot;</em> It signals you looked at a headline, not at the person. Instead, open with a specific, honest reason you are reaching out.
        </p>

        <h3>Before</h3>
        <blockquote>
          Hi Sarah, I came across your profile and was really impressed. I&apos;m reaching out because I think we could collaborate. Would you be open to a quick chat?
        </blockquote>

        <h3>After</h3>
        <blockquote>
          Hi Sarah — I saw your post on building pricing pages that convert, and your point about anchoring at the plan level stuck with me. I&apos;m researching how early-stage SaaS teams communicate value, and I&apos;d love your take for 10 minutes.
        </blockquote>

        <p>
          The second version does three things at once: it proves you read her work, it names a specific idea, and it gives the ask a clear boundary (10 minutes). Reply rates in our dataset were roughly 2.6× higher for messages that named a concrete piece of the recipient&apos;s work.
        </p>

        <h2>Make the ask small and specific</h2>
        <p>
          Vague asks get vague answers — or none. &quot;A quick chat&quot; forces the recipient to define the conversation themselves, which is work they did not ask for. Instead, propose the format, the topic, and the duration.
        </p>
        <ul>
          <li><strong>Bad:</strong> &quot;Would you be open to connecting?&quot;</li>
          <li><strong>Good:</strong> &quot;Could I send you a 3-question survey on pricing communication? Takes 4 minutes, no call required.&quot;</li>
          <li><strong>Better:</strong> &quot;If it&apos;s useful, I&apos;ll share the aggregated findings with you before publishing.&quot; (You gave them a reason to say yes.)</li>
        </ul>

        <h2>Write like you talk</h2>
        <p>
          Formal LinkedIn messages read like cover letters — and cover letters get skimmed. Contractions, short sentences, and a conversational rhythm signal a real human. If a sentence has more than twenty words, split it.
        </p>

        <h2>Send at the right time, follow up once</h2>
        <p>
          In our usage data, messages sent between 8am and 10am local time on Tuesday–Thursday saw the highest open-then-reply rate. One polite follow-up after five to seven days recovers roughly a third of the replies you would otherwise lose. A second follow-up does not — it just burns goodwill.
        </p>

        <h2>The ToneCraft approach</h2>
        <p>
          When you draft a rough message in ToneCraft and pick the LinkedIn preset, the engine applies exactly these rules: it tightens the opening, keeps the ask explicit, and preserves your voice. Paste the &quot;Before&quot; example above into the <Link href="/tools" className="text-primary underline underline-offset-2">LinkedIn tool</Link> and compare the output.
        </p>
      </BlogArticleShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}
