/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Marketplace seed — publishes high-quality sample listings so the Phase 14
 * marketplace can be demoed immediately.
 *
 * Usage:
 *   node prisma/seed.js                     # seed to the first user in the DB
 *   node prisma/seed.js --email=a@b.co      # seed to a specific user
 *   node prisma/seed.js --reset             # delete previously-seeded rows first
 *   node prisma/seed.js --enable-feature    # also flip the marketplace feature flag ON
 *
 * Idempotent: a listing whose (title, authorId) already exists is skipped.
 * NOTE: edits to the LISTINGS array below only apply on re-run with --reset.
 * Reviews/downloads are attached from up to 3 OTHER real users when present
 * (so aggregates stay consistent with the review rows); otherwise listings
 * are created with zeroed stats — still fully browsable.
 *
 * downloadCount includes a fabricated base (DOWNLOADS) so the demo looks
 * lived-in; review/download ROWS stay consistent with ratingCount — the
 * base count is a display metric only.
 *
 * The marketplace UI is feature-gated (marketplace flag, enterprise by
 * default). Use --enable-feature to turn it on in the same run so the
 * demo is immediately visible.
 *
 * Plain CommonJS on purpose — no tsx/ts-node dependency.
 */
require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const args = process.argv.slice(2);
const emailArg = args.find((a) => a.startsWith("--email="))?.slice("--email=".length);
const reset = args.includes("--reset");
const enableFeature = args.includes("--enable-feature");

// Same adapter setup as src/lib/prisma.ts (direct Neon endpoint).
const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  (() => {
    throw new Error("DIRECT_URL or DATABASE_URL environment variable is not set");
  })();

// pg warns for sslmode=prefer|require|verify-ca (aliases of verify-full) —
// normalize so the deprecation warning never prints (see src/lib/prisma.ts).
const normalizeSslMode = (url) =>
  url.replace(/sslmode=(prefer|require|verify-ca)(?=&|$)/gi, "sslmode=verify-full");

const pool = new Pool({
  connectionString: normalizeSslMode(connectionString),
  max: 3,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
  ...({ enableChannelBinding: true }),
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Trend/score helper mirroring MarketplaceService.computeTrendingScore. */
function trendingScore(downloads, ratingAgg, ratingCount, ageDays) {
  const d = Math.min(downloads, 1000) / 100;
  const r = ratingCount > 0 ? (ratingAgg / 5) * 5 : 0;
  const recency = Math.max(0, 1 - ageDays / 90);
  return Number((d * 1.2 + r * 1.6 + recency * 2).toFixed(4));
}

const LISTINGS = [
  {
    kind: "prompt",
    title: "Cold Email That Actually Gets Replies",
    description:
      "A structured outreach prompt that researches the prospect, finds a real hook, and writes a short email with a single clear ask. Works with any AI model.",
    tags: ["email", "sales", "outreach", "b2b"],
    license: "cc-by-4.0",
    priceCredits: 0,
    featured: true,
    content: {
      text: `You are a senior B2B sales writer. Write a cold email for the context below.

Rules:
1. Research the prospect from the company/role I give you — find ONE genuine hook (recent news, shared connection, a public post, or an obvious gap).
2. Keep it under 120 words. No fluff, no "I hope this finds you well".
3. Make exactly one ask — a 15-minute call or a one-line reply.
4. End with a P.S. that adds a second, lighter reason to reply.

Context:
- Prospect: {{prospect_name}}, {{prospect_role}} at {{company}}
- What we do: {{product_one_liner}}
- Outcome they'd care about: {{desired_outcome}}

Output the email with a short subject line, then a 3-bullet "why this works" breakdown.`,
      variables: ["prospect_name", "prospect_role", "company", "product_one_liner", "desired_outcome"],
    },
  },
  {
    kind: "prompt",
    title: "LinkedIn Thought-Leadership Post",
    description:
      "Turns a raw idea or experience into a scroll-stopping LinkedIn post: strong hook, tight story, one lesson, and a question to drive comments.",
    tags: ["linkedin", "social", "personal-brand", "writing"],
    license: "cc-by-4.0",
    priceCredits: 0,
    content: {
      text: `You are a ghostwriter for founders on LinkedIn.

Turn my raw note below into a post that gets engagement:
1. Hook (first line, ≤ 12 words, curiosity gap or contrarian take).
2. A short concrete story with a specific number or detail.
3. The lesson — one sentence, framed as a principle, not advice.
4. A question to the reader (open-ended, easy to answer).
5. 2–3 relevant hashtags.

Constraints: no "I'm excited to share", no clichés, plain language, 130–220 words. Write 2 variations.

Raw note: {{raw_idea}}`,
      variables: ["raw_idea"],
    },
  },
  {
    kind: "agent",
    title: "Research Synthesizer Agent",
    description:
      "A specialized agent config that takes messy research notes and produces a cited, structured brief: key findings, tensions, and open questions.",
    tags: ["research", "agent", "analysis"],
    license: "cc-by-4.0",
    priceCredits: 150,
    featured: false,
    content: {
      systemPrompt:
        "You are a research synthesizer. You receive raw notes, transcripts, or links. You output a brief with: (1) Key findings (5-8, each with a confidence tag), (2) Tensions or contradictions between sources, (3) What's still unknown, (4) A recommended next step. Cite the source snippet for every claim. Never invent sources.",
      temperature: 40,
      maxSteps: 3,
      tools: ["recall_memory", "knowledge_retrieval"],
    },
  },
  {
    kind: "workflow",
    title: "Weekly Content Repurposer",
    description:
      "A 4-step automation: take one long-form draft and turn it into a newsletter, 3 social posts, a thread, and a short video script — with a consistent voice.",
    tags: ["workflow", "content", "repurposing", "automation"],
    license: "cc-by-4.0",
    priceCredits: 200,
    featured: true,
    content: {
      steps: [
        { id: "summarize", action: "Summarize the source document into 5 core ideas", model: "auto" },
        { id: "newsletter", action: "Write a 400-word newsletter from the 5 ideas", tone: "professional" },
        { id: "social", action: "Write 3 platform posts (LinkedIn, X, Instagram) from idea #1", tone: "friendly" },
        { id: "thread", action: "Write a 10-tweet thread from idea #2", tone: "creative" },
        { id: "video", action: "Write a 60-second video script from idea #3", tone: "casual" },
      ],
      input: "source_document_id",
      schedule: "weekly",
    },
  },
  {
    kind: "persona",
    title: "The Confident Founder",
    description:
      "A voice persona that writes with conviction, short sentences, and zero filler — perfect for announcements, pitches, and founder-led comms.",
    tags: ["persona", "founder", "voice", "pitch"],
    license: "cc-by-4.0",
    priceCredits: 0,
    featured: false,
    content: {
      systemPrompt:
        "You write like a confident founder: declarative, concrete, and warm. Short sentences. Active voice. No hedging words (maybe, hopefully, just, sort of). Numbers and specifics over adjectives. You can be direct but never arrogant.",
      tone: "professional",
      temperature: 55,
      writingStyle: "punchy",
      emojiUsage: "none",
    },
  },
  {
    kind: "template",
    title: "Product Launch Kit",
    description:
      "A full launch template: announcement copy, email sequence (3 emails), social calendar, FAQ, and press release skeleton. Drop in your product details.",
    tags: ["template", "launch", "marketing", "go-to-market"],
    license: "cc-by-4.0",
    priceCredits: 300,
    featured: false,
    content: {
      sections: [
        { id: "announcement", label: "Launch announcement", prompt: "Write the announcement using {{product}} and {{launch_date}}" },
        { id: "emails", label: "3-email sequence", prompt: "Write teaser, launch-day, and follow-up emails" },
        { id: "social", label: "Social calendar", prompt: "Generate a 7-day social content calendar" },
        { id: "faq", label: "FAQ", prompt: "Write 10 FAQs from the spec" },
        { id: "press", label: "Press release skeleton", prompt: "Draft a press release skeleton" },
      ],
      variables: ["product", "launch_date", "target_audience"],
    },
  },
];

const REVIEWS_BY_TITLE = {
  "Cold Email That Actually Gets Replies": [
    { rating: 5, review: "Used it for 30 prospects this week — reply rate doubled. The hook research step is the secret." },
    { rating: 4, review: "Solid structure. I tweak the P.S. every time but the core works well." },
  ],
  "LinkedIn Thought-Leadership Post": [
    { rating: 5, review: "The 2-variations output is great for A/B testing hooks." },
  ],
  "Research Synthesizer Agent": [
    { rating: 4, review: "Great structure. Confidence tags are a nice touch for internal work." },
  ],
  "Weekly Content Repurposer": [
    { rating: 5, review: "One draft in, 6 pieces out. The newsletter step alone saves me an hour a week." },
    { rating: 5, review: "Voice stays consistent across all steps — exactly what I needed." },
  ],
  "The Confident Founder": [
    { rating: 4, review: "My announcement posts finally sound like me on a good day." },
  ],
  "Product Launch Kit": [
    { rating: 5, review: "Shipped our launch in a weekend using this. The email sequence is excellent." },
  ],
};

const DOWNLOADS = 40; // base demo download count per listing

async function main() {
  console.log("🌱 Marketplace seed starting…");

  // 1. Resolve the author user.
  const author = emailArg
    ? await prisma.user.findUnique({ where: { email: emailArg } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!author) {
    console.error(
      "❌ No user found." +
        (emailArg ? ` (email ${emailArg} doesn't exist)` : " (the database has no users yet — sign in first)") +
        "\n   Pass --email=<your-email> to seed to a specific account."
    );
    process.exit(1);
  }
  console.log(`👤 Author: ${author.email} (${author.id})`);

  // 2. Ensure a creator profile exists (handle collisions get a numeric suffix).
  const baseHandle =
    author.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || `creator_${author.id.slice(0, 8)}`;
  let profile = null;
  for (let attempt = 0; attempt < 5 && !profile; attempt++) {
    const handle = attempt === 0 ? baseHandle : `${baseHandle.slice(0, 20)}_${attempt + 1}`;
    try {
      profile = await prisma.creatorProfile.upsert({
        where: { userId: author.id },
        create: { userId: author.id, handle, bio: "ToneCraft sample creator — publishing prompts, agents, and templates for the community." },
        update: {},
      });
    } catch {
      // handle taken → try the next suffix
    }
  }
  if (!profile) {
    console.error("❌ Could not create a unique creator handle — aborting.");
    process.exit(1);
  }
  console.log(`🧑‍🎨 Creator profile ready: @${profile.handle}`);

  // 3. Optional reset of previously-seeded rows.
  if (reset) {
    const titles = LISTINGS.map((l) => l.title);
    const removed = await prisma.marketplaceListing.deleteMany({
      where: { authorId: author.id, title: { in: titles } },
    });
    console.log(`🧹 Reset: removed ${removed.count} previously-seeded listings`);
  }

  // 4. Gather up to 3 OTHER users for realistic reviews/downloads.
  const otherUsers = await prisma.user.findMany({
    where: { id: { not: author.id } },
    take: 3,
    select: { id: true },
  });

  // 4b. Optional: enable the marketplace feature flag so the demo is visible.
  if (enableFeature) {
    await prisma.featureOverride.upsert({
      where: { key: "marketplace" },
      create: { key: "marketplace", enabled: true, note: "Enabled by marketplace seed script" },
      update: { enabled: true, note: "Enabled by marketplace seed script" },
    });
    console.log("🚩 Marketplace feature flag enabled (Admin → Features override)");
  }

  // 5. Upsert each listing.
  let created = 0;
  let skipped = 0;
  for (const def of LISTINGS) {
    const existing = await prisma.marketplaceListing.findFirst({
      where: { authorId: author.id, title: def.title },
    });
    if (existing) {
      skipped += 1;
      console.log(`⏭️  Skipped (exists): ${def.title}`);
      continue;
    }

    const reviewsFor = REVIEWS_BY_TITLE[def.title] ?? [];
    const reviewers = otherUsers.slice(0, reviewsFor.length);
    const reviewCount = reviewers.length;
    const ratingAgg =
      reviewCount > 0
        ? Number((reviewsFor.slice(0, reviewCount).reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(3))
        : 0;
    const downloadCount = DOWNLOADS + otherUsers.length;
    const ageDays = 12;

    const listing = await prisma.marketplaceListing.create({
      data: {
        kind: def.kind,
        title: def.title,
        description: def.description,
        content: def.content,
        tags: def.tags,
        license: def.license,
        priceCredits: def.priceCredits,
        status: "published",
        authorId: author.id,
        ratingAgg,
        ratingCount: reviewCount,
        downloadCount,
        trendingScore: trendingScore(downloadCount, ratingAgg, reviewCount, ageDays),
        featured: def.featured,
        createdAt: new Date(Date.now() - ageDays * 86_400_000),
      },
    });

    // Attach real review/download rows from other users (keeps stats honest).
    for (let i = 0; i < reviewers.length; i++) {
      await prisma.listingReview.create({
        data: {
          listingId: listing.id,
          userId: reviewers[i].id,
          rating: reviewsFor[i].rating,
          review: reviewsFor[i].review,
        },
      });
      await prisma.listingDownload.upsert({
        where: { listingId_userId: { listingId: listing.id, userId: reviewers[i].id } },
        create: { listingId: listing.id, userId: reviewers[i].id },
        update: {},
      });
    }

    created += 1;
    console.log(`✅ Published: [${def.kind}] ${def.title}${reviewCount > 0 ? ` (${reviewCount}★ reviews)` : ""}`);
  }

  const total = await prisma.marketplaceListing.count({ where: { status: "published" } });
  console.log(`\n🎉 Done — ${created} created, ${skipped} skipped. Marketplace now has ${total} published listing(s).`);
  if (enableFeature) {
    console.log("   Visit /marketplace — the marketplace feature flag is already ON.");
  } else {
    console.log('   Visit /marketplace (feature flag: enable "marketplace" in Admin → Features, or re-run with --enable-feature).');
  }
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    pool.end().catch(() => {});
  });
