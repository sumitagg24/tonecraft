import type { LucideIcon } from "lucide-react";
import {
  Edit3, AlignLeft, Maximize2, CheckCircle2, Globe,
  Network, AtSign, Hash, MessageSquare, Camera,
  Mail, FileBarChart, FileText, Briefcase, Send,
  Library, BookOpen, Users, LayoutList,
  GraduationCap, Megaphone, Target, Rocket, Search, Building2, Handshake, Code2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────
   Marketing navigation data — single source of truth for the landing
   navbar mega menus (Features / Solutions / Tools / Resources) and the
   Solutions landing pages.
   ───────────────────────────────────────────────────────────────────── */

export interface MarketingNavItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export interface MarketingGroup {
  title: string;
  items: MarketingNavItem[];
}

/** Features mega menu — four groups, each item deep-links into the app. */
export const FEATURES_GROUPS: MarketingGroup[] = [
  {
    title: "AI Writing",
    items: [
      { label: "Rewrite", description: "Polish any draft into the perfect tone", href: "/tools?tool=professional-rewrite", icon: Edit3 },
      { label: "Summarize", description: "Condense long text to key points", href: "/tools?tool=summarize", icon: AlignLeft },
      { label: "Expand", description: "Turn short notes into full content", href: "/tools?tool=enhance", icon: Maximize2 },
      { label: "Grammar", description: "Fix errors and sharpen clarity", href: "/tools?tool=grammar-fix", icon: CheckCircle2 },
      { label: "Translate", description: "Speak 50+ languages, tone intact", href: "/tools?tool=translate", icon: Globe },
    ],
  },
  {
    title: "Social Media",
    items: [
      { label: "LinkedIn", description: "Posts, hooks, carousels & stories", href: "/tools?tool=linkedin-post", icon: Network },
      { label: "X (Twitter)", description: "Threads, hooks & viral rewrites", href: "/tools?tool=twitter-thread", icon: AtSign },
      { label: "Threads", description: "Casual, conversational updates", href: "/tools?tool=threads-post", icon: Hash },
      { label: "Reddit", description: "Helpful, community-safe posts", href: "/tools?tool=reddit-helpful", icon: MessageSquare },
      { label: "Instagram", description: "Scroll-stopping captions", href: "/tools?tool=instagram-caption", icon: Camera },
    ],
  },
  {
    title: "Professional",
    items: [
      { label: "Email", description: "Emails that get replies", href: "/tools?tool=email-writer", icon: Mail },
      { label: "Proposal", description: "Persuasive business proposals", href: "/tools?tool=business-proposal", icon: FileBarChart },
      { label: "Resume", description: "Powerful achievement bullets", href: "/tools?tool=resume-bullet", icon: FileText },
      { label: "Cover Letter", description: "Compelling job applications", href: "/tools?tool=cover-letter", icon: Briefcase },
      { label: "Sales", description: "Cold outreach that converts", href: "/tools?tool=cold-email", icon: Send },
    ],
  },
  {
    title: "Productivity",
    items: [
      { label: "Knowledge Base", description: "Your facts, grounded in every reply", href: "/library", icon: Library },
      { label: "Prompt Library", description: "Proven templates & prompt packs", href: "/library", icon: BookOpen },
      { label: "Personas", description: "Custom voices that sound like you", href: "/chat", icon: Users },
      { label: "Workspace", description: "Projects, notes & collaboration", href: "/chat", icon: LayoutList },
    ],
  },
];

export interface Solution {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  bullets: { title: string; body: string }[];
  tools: string[];
  icon: LucideIcon;
}

/** Solutions mega menu + /solutions landing pages. */
export const SOLUTIONS: Solution[] = [
  {
    slug: "students",
    name: "Students",
    tagline: "Write better essays, emails, and applications — in your own voice.",
    description:
      "From class emails to professors to essays that actually sound like you, ToneCraft helps students communicate with clarity and confidence — without the generic AI feel.",
    bullets: [
      { title: "Polished applications", body: "Cover letters and personal statements that sound human, not templated." },
      { title: "Clear academic writing", body: "Rewrite and summarize drafts while keeping your argument intact." },
      { title: "Everyday comms", body: "Group projects, professor emails, and internship outreach — perfect every time." },
    ],
    tools: ["professional-rewrite", "grammar-fix", "summarize", "cover-letter"],
    icon: GraduationCap,
  },
  {
    slug: "marketing",
    name: "Marketing",
    tagline: "Ship on-brand copy across every channel, every day.",
    description:
      "Campaigns live and die on consistent, compelling copy. ToneCraft gives marketing teams a single tool to produce on-brand posts, emails, and landing copy at speed.",
    bullets: [
      { title: "Channel-ready content", body: "One idea becomes a LinkedIn post, X thread, Instagram caption, and newsletter." },
      { title: "Consistent brand voice", body: "Personas encode your brand tone so every writer sounds like the same team." },
      { title: "Faster iteration", body: "Rewrite, expand, or simplify any draft in seconds — A/B variants included." },
    ],
    tools: ["linkedin-post", "twitter-thread", "instagram-caption", "email-writer"],
    icon: Megaphone,
  },
  {
    slug: "sales",
    name: "Sales",
    tagline: "Outreach that gets replies — at every stage of the pipeline.",
    description:
      "ToneCraft helps sales teams write cold emails, follow-ups, and proposals that sound human and get responses, without burning hours on drafts.",
    bullets: [
      { title: "Cold emails that convert", body: "Structured outreach with a single clear ask and a hook worth replying to." },
      { title: "Effortless follow-ups", body: "Gentle, effective nudges that don't feel spammy or desperate." },
      { title: "Meeting requests that land", body: "Polished invitations that respect the prospect's time." },
    ],
    tools: ["cold-email", "cold-email-followup", "business-proposal", "meeting-request"],
    icon: Target,
  },
  {
    slug: "founders",
    name: "Founders",
    tagline: "Founder-grade communication, without the founder hours.",
    description:
      "Announcements, investor updates, hiring posts, and launch copy — ToneCraft writes with conviction so founders can move fast and sound like themselves.",
    bullets: [
      { title: "Launch-day storytelling", body: "Announcements and Product Hunt copy that turns launches into moments." },
      { title: "Investor & team updates", body: "Clear, confident updates that keep everyone rowing the same direction." },
      { title: "Hiring posts that attract", body: "Job posts and outreach that bring the right people to you." },
    ],
    tools: ["linkedin-announcement", "linkedin-hiring", "producthunt-launch", "twitter-thread"],
    icon: Rocket,
  },
  {
    slug: "recruiters",
    name: "Recruiters",
    tagline: "Candidate outreach that gets 'yes' — without the template feel.",
    description:
      "Recruiters send dozens of messages a day. ToneCraft makes each one feel personal, professional, and worth responding to.",
    bullets: [
      { title: "Personalized at scale", body: "Outreach that references the candidate, not a template." },
      { title: "Professional follow-ups", body: "Polite persistence that keeps the pipeline moving." },
      { title: "On-brand employer voice", body: "Consistent messaging across every recruiter on the team." },
    ],
    tools: ["cold-email", "professional-reply", "linkedin-hiring", "email-writer"],
    icon: Search,
  },
  {
    slug: "content-creators",
    name: "Content Creators",
    tagline: "One idea. Every platform. Your voice.",
    description:
      "Creators juggle LinkedIn, X, Threads, Instagram, and more. ToneCraft repurposes your best ideas into native content for every channel — fast.",
    bullets: [
      { title: "Repurpose on autopilot", body: "Turn one long post into a thread, caption, and story in seconds." },
      { title: "Platform-native formats", body: "Carousels, hooks, quote-replies, and threads built for each algorithm." },
      { title: "A voice that stays yours", body: "Personas keep every channel sounding unmistakably like you." },
    ],
    tools: ["linkedin-carousel", "twitter-thread", "threads-post", "instagram-caption"],
    icon: Camera,
  },
  {
    slug: "businesses",
    name: "Businesses",
    tagline: "Every team communicates better — across the whole company.",
    description:
      "From HR to support to leadership, ToneCraft gives every team the same editorial standard for customer and internal communication.",
    bullets: [
      { title: "Customer-facing polish", body: "Support replies and announcements that sound human and on-brand." },
      { title: "Internal clarity", body: "Slack, email, and docs that respect everyone's time." },
      { title: "Governance built in", body: "Workspaces, roles, audit logs, and SSO for organizations." },
    ],
    tools: ["customer-support-reply", "email-writer", "apology-email", "slack-post"],
    icon: Building2,
  },
  {
    slug: "agencies",
    name: "Agencies",
    tagline: "Produce more client-ready copy, with fewer revisions.",
    description:
      "Agencies juggle many clients with many voices. ToneCraft keeps every account on-brand, on-tone, and on-deadline.",
    bullets: [
      { title: "Per-client personas", body: "A saved voice for every brand — switch in one click." },
      { title: "Faster turnarounds", body: "First drafts that clients actually accept, not just start from." },
      { title: "White-glove results", body: "Proposal-grade writing for pitches and monthly deliverables." },
    ],
    tools: ["email-writer", "business-proposal", "linkedin-post", "facebook-post"],
    icon: Handshake,
  },
  {
    slug: "developers",
    name: "Developers",
    tagline: "Docs, READMEs, release notes, and API copy that ship clean.",
    description:
      "Technical writing is communication too. ToneCraft helps developers write READMEs, changelogs, and support replies that are clear, precise, and human.",
    bullets: [
      { title: "Docs & READMEs", body: "Structured, skimmable technical content without the jargon soup." },
      { title: "Release notes & changelogs", body: "User-friendly notes your customers actually read." },
      { title: "Precise support replies", body: "Helpful, accurate answers that reduce back-and-forth." },
    ],
    tools: ["github-readme", "hackernews-post", "summarize", "grammar-fix"],
    icon: Code2,
  },
];

export interface ResourceItem {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

/** Resources mega menu — every link resolves to a real page. */
export const RESOURCES_ITEMS: ResourceItem[] = [
  { label: "Documentation", description: "Getting started, guides & credits", href: "/help", icon: BookOpen },
  { label: "Blog", description: "Writing guides & product stories", href: "/blog", icon: Edit3 },
  { label: "Changelog", description: "What shipped, when", href: "/changelog", icon: LayoutList },
  { label: "Roadmap", description: "What's coming next", href: "/roadmap", icon: Rocket },
  { label: "Help Center", description: "Guides, FAQ & support", href: "/help#faq", icon: Search },
  { label: "FAQ", description: "Quick answers to common questions", href: "/faq", icon: MessageSquare },
];

/** Shared FAQ — consumed by both the landing FAQ section and the /faq page. */
export const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "How does the AI engine work?",
    answer:
      "Every request is routed through a resilient AI engine that automatically picks the best model for the job — fast, low-cost models on the free tier and our most capable frontier models on Pro. If one backend is unavailable, the engine fails over automatically so your writing never stops.",
  },
  {
    question: "Is the free tier really free?",
    answer:
      "Yes. The free tier includes 30 AI generations per day, all tone presets, and the core writing engine — no credit card required, free forever.",
  },
  {
    question: "How does tone control work?",
    answer:
      "Each tone preset includes a carefully crafted system prompt that shapes the AI's communication style. Professional uses formal language with clear structure; Casual uses conversational, friendly language. The tone is applied to every message.",
  },
  {
    question: "Can I create custom tones?",
    answer:
      "Pro users can create unlimited custom personas with their own system prompts and voice. Free users get access to all built-in tones.",
  },
  {
    question: "What is a credit?",
    answer:
      "Every AI request consumes credits based on the model used — larger models cost more. Free users get a daily allowance, and you can see remaining credits and usage history in Settings and Analytics.",
  },
  {
    question: "Can I use ToneCraft for my business?",
    answer:
      "Yes. Workspaces support team projects, knowledge bases, and collaboration. Enterprise plans add SSO, audit logs, security policies, and dedicated support.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit and at rest. API keys for AI providers are encrypted and never exposed. We never sell or share your data.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. Cancel anytime from your billing settings. You'll keep Pro access until the end of your billing period — no cancellation fees.",
  },
];

/** Curated tool highlights for the Tools mega menu (ids from ToolDefinitions). */
export const TOOLS_MENU: { id: string; title: string; description: string }[] = [
  { id: "linkedin-post", title: "LinkedIn Post Writer", description: "Engaging professional content" },
  { id: "linkedin-carousel", title: "LinkedIn Carousel", description: "Slide-by-slide post structure" },
  { id: "twitter-thread", title: "Twitter/X Thread", description: "Viral thread generator" },
  { id: "instagram-caption", title: "Instagram Caption", description: "Scroll-stopping captions" },
  { id: "threads-post", title: "Threads Writer", description: "Casual, conversational updates" },
  { id: "cold-email", title: "Cold Email", description: "Outreach that gets replies" },
  { id: "email-writer", title: "Sales Email", description: "Emails that convert" },
  { id: "summarize", title: "Meeting Summary", description: "Condense to key points" },
  { id: "grammar-fix", title: "Grammar Fix", description: "Correct errors, keep meaning" },
  { id: "friendly-rewrite", title: "Tone Changer", description: "Any message, any voice" },
  { id: "professional-rewrite", title: "Professional Rewrite", description: "Formal, polished business writing" },
  { id: "casual-rewrite", title: "Casual Rewrite", description: "Relaxed, everyday language" },
  { id: "medium-post", title: "Blog Writer", description: "Thoughtful long-form posts" },
  { id: "enhance", title: "Article Expander", description: "Notes into full-length content" },
  { id: "resume-bullet", title: "Resume Builder", description: "Powerful achievement statements" },
  { id: "cover-letter", title: "Cover Letter", description: "Compelling job applications" },
];
