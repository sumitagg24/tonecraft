/* eslint-disable react/no-unescaped-entities -- prose-heavy docs page: apostrophes & quotes are intentional typography */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/suite/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileText, Plus, Trash2, Pin, Loader2, Eye, PencilLine,
  CheckCircle2, Wand2, Search, Compass, MessageSquare, Layers,
  BookMarked, BookOpen, BrainCircuit, Store, Users, CreditCard,
  ShieldCheck, LifeBuoy, ArrowRight, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  content: string;
  emoji: string | null;
  status: string;
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
}

const EMOJIS = ["📝", "📄", "✍️", "🚀", "💡", "📌", "🎯", "🧠", "📊", "✨"];

const AI_ACTIONS = [
  { id: "rewrite", label: "Rewrite" },
  { id: "summarize", label: "Summarize" },
  { id: "expand", label: "Expand" },
  { id: "grammar", label: "Grammar" },
  { id: "continue", label: "Continue" },
  { id: "plan", label: "Plan" },
] as const;

const TONES = ["professional", "friendly", "casual", "formal", "funny", "creative"];

/* ────────────────────────────────────────────────────────────────
 * Platform documentation content
 * ──────────────────────────────────────────────────────────────── */

function GuideHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground mt-2">
      <span className="h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
      {children}
    </h3>
  );
}

function GuideList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/80">
          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Tip({ title = "Tip", children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        <Wand2 className="w-3.5 h-3.5" /> {title}
      </p>
      <p className="text-sm leading-relaxed text-foreground/75">{children}</p>
    </div>
  );
}

function RelatedLinks({ links }: { links: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {links.map((link) => (
        <Badge key={link} variant="outline" className="text-nano font-medium">
          {link}
        </Badge>
      ))}
    </div>
  );
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  keywords: string[];
  body: React.ReactNode;
}

const GUIDES: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Compass,
    summary: "Create your account, write your first message, and explore the studio.",
    keywords: ["start", "welcome", "signup", "sign up", "first chat", "beginner", "onboarding", "account"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          ToneCraft is an AI communication studio. You bring the idea; it crafts the message — tuned to
          the right tone, platform, and audience. Everything you need in your first five minutes is below.
        </p>
        <GuideHeading>1. Create your account</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Head to the <strong>Sign Up</strong> page and create a free account — no credit card required.
          Your free plan includes <strong>30 AI generations per day</strong>, the full prompt library,
          knowledge base, and workspace tools.
        </p>
        <GuideHeading>2. Open the studio</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          From the navigation rail, click <strong>Compose</strong> (or the ToneCraft logo to return home).
          You'll land on the chat studio. Click <strong>New Chat</strong> to start a fresh conversation,
          or pick an existing one from the conversation list on the left.
        </p>
        <GuideHeading>3. Write your first message</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Type what you want to say — a rough draft, bullet points, or even a few keywords — then press{" "}
          <strong>Enter</strong>. ToneCraft will transform your input into polished, publication-ready
          copy. Use the tone chip above the composer to switch between professional, friendly, casual,
          and more before generating.
        </p>
        <GuideHeading>4. Explore the tools hub</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Open <strong>Tools</strong> to browse 30+ purpose-built capabilities: LinkedIn posts, Twitter
          threads, cold emails, blog writing, grammar fixes, resumes, and more. Every tool works like a
          guided chat — describe what you need and refine the output.
        </p>
        <Tip>
          All your work is saved automatically. Conversations, prompts, and documents sync across devices,
          so you can start on one screen and finish on another.
        </Tip>
        <RelatedLinks links={["Chat & Studio", "Tools & Capabilities", "Plans & Billing"]} />
      </>
    ),
  },
  {
    id: "chat-studio",
    title: "Chat & Studio",
    icon: MessageSquare,
    summary: "Compose, tone, personas, copying output, and searching conversations.",
    keywords: ["chat", "compose", "message", "tone", "persona", "composer", "copy", "export", "search"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          The studio is where your writing happens. It pairs a distraction-free composer with an editorial
          reading experience — messages read like notes, not chat bubbles.
        </p>
        <GuideHeading>Choosing a tone</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Click the tone chip above the composer to cycle through the built-in tones. Each generation
          respects the active tone, so you can rewrite the same idea in professional, executive, friendly,
          or casual voice with one click.
        </p>
        <GuideHeading>Personas</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Personas give the AI a consistent voice across chats and tools. Create custom personas in{" "}
          <strong>Settings → Personas</strong> — give them a name, description, and system prompt — then
          select them from the persona picker in the composer. This is ideal for recurring voices like
          "Support Lead" or "Personal Brand Coach".
        </p>
        <GuideHeading>Copying and reusing output</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Every AI message has a <strong>copy</strong> action so you can lift the final text straight into
          LinkedIn, email, or your docs. You can also favorite a conversation from the conversation list
          to pin it for quick access, archive it, or export the full thread.
        </p>
        <GuideHeading>Finding a conversation</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Click the <strong>search</strong> button in the chat header — a centered search bar opens, letting
          you filter every conversation by title as you type. Press <strong>Esc</strong> to close it and
          clear the filter.
        </p>
        <GuideHeading>Context panel</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Open the right-hand <strong>context panel</strong> while chatting to surface relevant knowledge,
          memories, and linked documents that ToneCraft will consider before answering. Great for keeping
          long-running projects grounded.
        </p>
        <Tip title="Keyboard basics">
          Enter sends your message, Shift+Enter inserts a new line. That's all you need — no hidden
          shortcuts to memorize.
        </Tip>
        <RelatedLinks links={["Getting Started", "Personas & Tones", "Knowledge Base"]} />
      </>
    ),
  },
  {
    id: "tools",
    title: "Tools & Capabilities",
    icon: Layers,
    summary: "Browse 30+ AI capabilities, launch them instantly, and favorite your go-tos.",
    keywords: ["tool", "capability", "linkedin", "twitter", "email", "grammar", "resume", "blog", "launch"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          The Tools page is a capability hub: purpose-built AI workflows for the writing you do every day.
          Instead of a single generic chat, each tool ships with an optimized prompt and the right tone
          pre-selected.
        </p>
        <GuideHeading>Browse by category</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Tools are grouped by category — writing, business, social media, career, email, and replies. Use
          the category navigation to filter, search for a specific tool, or browse the trending and
          recently used sections.
        </p>
        <GuideHeading>Popular tools</GuideHeading>
        <GuideList
          items={[
            "LinkedIn Post Writer & Carousel — professional presence, in seconds.",
            "Twitter Threads & Tweets — hooks, structure, and CTA built in.",
            "Cold & Sales Emails — openers that earn a reply.",
            "Meeting Summaries — turn raw notes into shareable briefs.",
            "Grammar Fix & Tone Changer — polish anything before you hit send.",
            "Resume & Cover Letter Builder — tailored to the role description.",
            "Blog Writer & Article Expander — long-form drafts with structure.",
          ]}
        />
        <GuideHeading>Launching a tool</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Click any tool card to open it. Each tool opens a focused composer pre-wired for that job —
          describe your input and hit generate. Favorite the tools you use most so they float to the top
          of your list.
        </p>
        <Tip>
          Tools and the chat studio share the same engine and the same daily generation budget, so you can
          jump between them freely.
        </Tip>
        <RelatedLinks links={["Getting Started", "Chat & Studio", "Library & Prompts"]} />
      </>
    ),
  },
  {
    id: "library",
    title: "Library & Prompts",
    icon: BookMarked,
    summary: "Save prompts, build collections, favorite what works, and reuse everywhere.",
    keywords: ["library", "prompt", "collection", "folder", "favorite", "template", "save", "reuse"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          The Library is your personal prompt shelf. Save the prompts that produce great results, organize
          them into collections, and reuse them in any chat or tool with one click.
        </p>
        <GuideHeading>Saving a prompt</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          From the Library page, click <strong>New Prompt</strong>, give it a name, and paste the
          instruction. Add variables like {"{topic}"} or {"{audience}"} to make the prompt reusable across
          different inputs. Save it to a collection to keep related prompts together.
        </p>
        <GuideHeading>Using a saved prompt</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          In any chat, open the prompt picker and select a saved prompt — it loads straight into the
          composer, ready for you to fill in the variables. Favorited prompts appear at the top of the
          picker.
        </p>
        <GuideHeading>Organizing</GuideHeading>
        <GuideList
          items={[
            "Collections — group prompts by project, platform, or campaign.",
            "Favorites — heart the prompts you reach for daily.",
            "Search — filter by name or content instantly.",
            "Pin important prompts to the top of the list.",
          ]}
        />
        <Tip>
          Write prompts as instructions to a capable writer, not a computer: give context, constraints,
          and an example output. ToneCraft handles the rest.
        </Tip>
        <RelatedLinks links={["Tools & Capabilities", "Knowledge Base", "Marketplace"]} />
      </>
    ),
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    icon: BookOpen,
    summary: "Upload documents, search them semantically, and ground AI answers in your material.",
    keywords: ["knowledge", "upload", "document", "pdf", "semantic", "search", "citation", "ground"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          The Knowledge Base turns your documents into a research workspace. Upload PDFs, notes, and
          articles — ToneCraft indexes them so AI answers can cite your own material instead of guessing.
        </p>
        <GuideHeading>Uploading documents</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Open the Knowledge page and drop files into the upload area. Each document is indexed
          automatically; the status badge shows when it's ready to use. Free accounts can store up to
          100 MB; Pro and Business plans expand that to 5 GB.
        </p>
        <GuideHeading>Semantic search</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Search the Knowledge page by meaning, not just keywords. Ask "what did we decide about pricing?"
          and ToneCraft will find the passage that answers it, even if the document uses different words.
        </p>
        <GuideHeading>Grounding conversations</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Link knowledge items to a chat from the context panel or knowledge picker. When a linked document
          is relevant to your question, the AI will reference it and show which source it drew from —
          making answers verifiable.
        </p>
        <Tip>
          Connect knowledge before long-running projects: the context panel automatically surfaces relevant
          documents while you write, so you never have to re-read a brief.
        </Tip>
        <RelatedLinks links={["Memory", "Chat & Studio", "Workspace"]} />
      </>
    ),
  },
  {
    id: "memory",
    title: "Memory",
    icon: BrainCircuit,
    summary: "ToneCraft remembers your preferences and work context across sessions.",
    keywords: ["memory", "remember", "recall", "context", "knowledge graph", "preference", "importance"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          Memory gives ToneCraft continuity. Facts you teach it — preferences, style rules, project
          context — persist and inform future generations, so the output feels like it was written by
          someone who knows you.
        </p>
        <GuideHeading>Teaching ToneCraft</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          On the Memory page, use <strong>Remember</strong> to save a fact: "I prefer short sentences in
          marketing copy" or "The Q3 launch targets enterprise teams." You can also save facts implicitly —
          relevant chat turns can be promoted into long-term memory.
        </p>
        <GuideHeading>Semantic recall</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          The <strong>Semantic recall</strong> box answers questions against your memories by meaning.
          Each result shows a relevance score and importance, so you can see why it was surfaced.
        </p>
        <GuideHeading>Importance & decay</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Every memory carries an importance score (0–100) that rises when the memory is recalled and
          decays slowly when it isn't. Frequently used memories stay front-of-mind; stale ones fade.
        </p>
        <GuideHeading>AI Context Builder</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Click <strong>Build context</strong> to see exactly what ToneCraft would consider before a
          request — memories, knowledge, recent chats, open tasks, and upcoming calendar events. Review it
          to understand (and steer) how your AI works.
        </p>
        <Tip>
          Visit <strong>Memory → Knowledge Graph</strong> to visualize how memories connect — useful for
          spotting gaps in what you've taught the system.
        </Tip>
        <RelatedLinks links={["Knowledge Base", "Chat & Studio", "Security & Privacy"]} />
      </>
    ),
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: Store,
    summary: "Discover community prompts and workflows, or publish your own for credits.",
    keywords: ["marketplace", "community", "publish", "install", "listing", "creator", "rating", "review"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          The Marketplace is a store of community-crafted capabilities — prompts, agents, personas, and
          workflows. Find a proven formula instead of starting from a blank page.
        </p>
        <GuideHeading>Browsing & installing</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Browse by category or search by keyword. Each listing shows its rating, download count, and
          creator. Open a listing to read reviews and preview the content, then install it into your
          workspace with one click.
        </p>
        <GuideHeading>Rating & reviewing</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          After installing, rate listings 1–5 stars and leave a short review. Ratings feed the trending
          score, so the best capabilities rise to the top.
        </p>
        <GuideHeading>Publishing</GuideHeading>
        <GuideList
          items={[
            "Create your listing with a title, description, tags, and the content payload.",
            "Choose a license and (optionally) a credit price.",
            "Publish when ready — your creator profile tracks downloads and ratings.",
            "Follow other creators to keep up with their new work.",
          ]}
        />
        <Tip>
          Well-described listings with examples consistently earn higher ratings — show buyers exactly what
          the capability produces.
        </Tip>
        <RelatedLinks links={["Library & Prompts", "Tools & Capabilities", "Plans & Billing"]} />
      </>
    ),
  },
  {
    id: "workspace",
    title: "Workspace & Collaboration",
    icon: Users,
    summary: "Workspaces, projects, teammates, invites, and realtime presence.",
    keywords: ["workspace", "team", "member", "invite", "project", "collaborate", "presence", "share"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          Workspaces bring your work and your team together. Projects inside a workspace keep chats,
          knowledge, and tasks organized; members collaborate with realtime presence and typing
          indicators.
        </p>
        <GuideHeading>Creating a workspace</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Use <strong>New Workspace</strong> from the workspace switcher, give it a name and color, and
          choose its visibility. Workspaces can hold multiple projects, each with its own conversations,
          documents, and knowledge files.
        </p>
        <GuideHeading>Inviting members</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Open workspace settings and send an invite by email. Members accept via the invite link, then
          appear in the member list with role badges. Owners can change roles or remove members at any
          time; every sensitive action is recorded in the audit log.
        </p>
        <GuideHeading>Working together</GuideHeading>
        <GuideList
          items={[
            "Realtime presence — see who's online in the workspace.",
            "Typing indicators — know when a teammate is composing.",
            "Comments & mentions — tag teammates with @email on any message.",
            "Activity feed — a shared timeline of what changed and when.",
          ]}
        />
        <Tip>
          Pin the workspace you use most so it sits at the top of the switcher — no hunting through
          folders.
        </Tip>
        <RelatedLinks links={["Getting Started", "Knowledge Base", "Security & Privacy"]} />
      </>
    ),
  },
  {
    id: "billing",
    title: "Plans, Credits & Billing",
    icon: CreditCard,
    summary: "Free vs Pro vs Enterprise, generation limits, invoices, and the customer portal.",
    keywords: ["billing", "plan", "pro", "enterprise", "price", "invoice", "checkout", "credits", "subscription", "limit"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          ToneCraft runs on simple, generous plans. Your account's plan controls daily AI generations,
          knowledge storage, and team features.
        </p>
        <GuideHeading>Free</GuideHeading>
        <GuideList
          items={[
            "30 AI generations per day — enough for daily writing.",
            "Full prompt library, knowledge base (100 MB), and workspace tools.",
            "Personal workspace with projects and notes.",
          ]}
        />
        <GuideHeading>Pro</GuideHeading>
        <GuideList
          items={[
            "Unlimited AI generations with priority access to the fastest models.",
            "Expanded knowledge storage (5 GB) and exports.",
            "Everything in Free, plus advanced personas and tones.",
          ]}
        />
        <GuideHeading>Enterprise</GuideHeading>
        <GuideList
          items={[
            "Team collaboration, organization hierarchy, and SSO.",
            "Admin dashboard, audit logs, and security policies.",
            "Dedicated support and custom limits — contact sales.",
          ]}
        />
        <GuideHeading>Managing your subscription</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Open <strong>Billing</strong> from Settings. You'll see your current plan, live usage, invoices,
          and payment history. Pro subscribers can open the <strong>Customer Portal</strong> to update
          payment methods or cancel. Upgrade buttons open a secure checkout handled by Paddle; after a
          successful payment you're upgraded instantly.
        </p>
        <Tip>
          Hitting the daily limit? Generation attempts pause with a friendly notice instead of failing —
          upgrade to Pro or wait for the next day's reset.
        </Tip>
        <RelatedLinks links={["Getting Started", "Security & Privacy", "Workspace & Collaboration"]} />
      </>
    ),
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: ShieldCheck,
    summary: "How your data is stored, encrypted, and protected — and your control over it.",
    keywords: ["security", "privacy", "data", "encryption", "delete", "sso", "audit"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          Your words are your work product. ToneCraft treats them accordingly — with transparent storage,
          scoped access, and full user control.
        </p>
        <GuideHeading>Data handling</GuideHeading>
        <GuideList
          items={[
            "Your chats, documents, and memories are private to your account by default.",
            "Content is stored encrypted at rest and served only over TLS.",
            "Workspace visibility is explicit — public workspaces are opt-in.",
            "You can delete individual memories, documents, or your entire account from Settings.",
          ]}
        />
        <GuideHeading>Enterprise controls</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Enterprise plans add organization-level security: enforced SSO, security policies (password
          rules, session timeouts, device limits), and a full audit log of administrative actions.
        </p>
        <Tip>
          Deleting your account removes your chats, documents, and memories permanently. Export what you
          need first.
        </Tip>
        <RelatedLinks links={["Plans & Billing", "Workspace & Collaboration", "Marketplace"]} />
      </>
    ),
  },
  {
    id: "faq",
    title: "FAQ & Troubleshooting",
    icon: LifeBuoy,
    summary: "Answers to common questions and fixes for frequent issues.",
    keywords: ["faq", "help", "troubleshoot", "error", "issue", "support", "limit", "billing", "broken"],
    body: (
      <>
        <p className="text-sm leading-relaxed text-foreground/80">
          Quick answers to the questions we hear most — and what to do when something doesn't behave.
        </p>
        <GuideHeading>Why did my generation stop?</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Free accounts get 30 generations per day. When the budget is spent, generation pauses with a
          clear notice. Check your usage on the <strong>Billing</strong> page; it resets each day, or
          upgrade to Pro for unlimited.
        </p>
        <GuideHeading>Why is checkout not opening?</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Checkout is handled by Paddle. If you see a billing error message, it includes the exact reason
          from the payment provider — usually a sandbox vs. live environment mismatch. Confirm you're
          testing against the right Paddle environment, then try again.
        </p>
        <GuideHeading>Where did my conversation go?</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Check the archived section of your conversation list, and use the centered search to find
          conversations by title. Conversations are never deleted automatically.
        </p>
        <GuideHeading>AI quality isn't what I expected</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          Try selecting a persona or tone first, and be specific in your input — include the audience,
          platform, and any constraints. Long-term memory also improves results over time as you teach the
          system your preferences.
        </p>
        <GuideHeading>Still stuck?</GuideHeading>
        <p className="text-sm leading-relaxed text-foreground/80">
          The public <strong>Help Center</strong> and <strong>FAQ</strong> pages cover more scenarios, and
          Pro/Enterprise users can reach support from the billing page. Include a short description of
          what you tried and what you expected.
        </p>
        <RelatedLinks links={["Getting Started", "Plans & Billing", "Help Center"]} />
      </>
    ),
  },
];

/* ────────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────────── */

export default function DocumentsPage() {
  const [tab, setTab] = useState<"guide" | "workspace">("guide");
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [emojiOpen, setEmojiOpen] = useState(false);
  // Fixed initial value so the server and first client render agree (no
  // hydration mismatch). The last-opened guide is restored from localStorage
  // after mount instead of read during the useState initializer.
  const [guideId, setGuideId] = useState<string>("getting-started");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tc:docs:guide");
      if (stored && GUIDES.some((g) => g.id === stored)) setGuideId(stored);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const [guideQuery, setGuideQuery] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = docs.find((d) => d.id === activeId) ?? null;
  const activeGuide = GUIDES.find((g) => g.id === guideId) ?? GUIDES[0];

  const selectGuide = useCallback((id: string) => {
    setGuideId(id);
    try {
      localStorage.setItem("tc:docs:guide", id);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const guideQueryTrimmed = guideQuery.trim().toLowerCase();
  const visibleGuides = guideQueryTrimmed
    ? GUIDES.filter(
        (g) =>
          g.title.toLowerCase().includes(guideQueryTrimmed) ||
          g.summary.toLowerCase().includes(guideQueryTrimmed) ||
          g.keywords.some((k) => k.includes(guideQueryTrimmed))
      )
    : GUIDES;

  const load = useCallback(async () => {
    try {
      const data = await api<Document[]>("/api/documents");
      setDocs(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchDoc = useCallback(async (id: string, data: Partial<Document>) => {
    try {
      const updated = await api<Document>(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setDocs((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return true;
    } catch {
      toast.error("Failed to save");
      return false;
    }
  }, []);

  const handleCreate = async () => {
    try {
      const doc = await apiPost<Document>("/api/documents", {
        title: "Untitled Document",
        content: "# Executive Summary 👋\n\nAuto-generated documentation space. Use AI assistant to refine tone, rewrite, or expand.",
        emoji: "📝",
      });
      setDocs((prev) => [doc, ...prev]);
      setActiveId(doc.id);
      setTab("workspace");
      setView("edit");
    } catch {
      toast.error("Failed to create document");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      if (activeId === id) setActiveId(docs.find((d) => d.id !== id)?.id ?? null);
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  // Debounced autosave on content change
  const handleContentChange = (value: string) => {
    if (!active) return;
    setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, content: value } : d)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await patchDoc(active.id, { content: value });
      setSaving(false);
    }, 800);
  };

  const runAi = async (action: string) => {
    if (!active || !active.content.trim()) return;
    setAiLoading(action);
    try {
      const result = await apiPost<{ content: string }>("/api/ai/assist", {
        action,
        text: active.content,
      });
      handleContentChange(result.content);
      toast.success("AI applied");
    } catch {
      toast.error("AI action failed");
    } finally {
      setAiLoading(null);
    }
  };

  const runAiTone = async (tone: string) => {
    if (!active) return;
    setAiLoading(`tone:${tone}`);
    try {
      const result = await apiPost<{ content: string }>("/api/ai/assist", {
        action: "tone",
        tone,
        text: active.content,
      });
      handleContentChange(result.content);
      toast.success(`Rewritten in ${tone} tone`);
    } catch {
      toast.error("Tone rewrite failed");
    } finally {
      setAiLoading(null);
    }
  };

  const markdownSource = active?.content ?? "";

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Documentation & Workspace"
          description="Explore ToneCraft platform guides or craft rich documents with real-time AI generation"
          icon={<FileText className="w-4 h-4" />}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/40">
                <button
                  onClick={() => setTab("guide")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    tab === "guide" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Platform Guides
                </button>
                <button
                  onClick={() => setTab("workspace")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    tab === "workspace" ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Document Workspace ({docs.length})
                </button>
              </div>
              <Button onClick={handleCreate} className="gap-1.5">
                <Plus className="w-4 h-4" /> New Document
              </Button>
            </div>
          }
        />

        {tab === "guide" ? (
          <div className="space-y-6">
            {/* Intro Banner */}
            <Card className="border-border/50 bg-card/60 p-8 shadow-editorial">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="mb-3 text-xs font-semibold">
                  Official Platform Documentation
                </Badge>
                <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-3">
                  The AI Communication Platform crafted for precision, nuance, and editorial excellence.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Write once, speak perfectly, everywhere. ToneCraft transforms your thoughts into tailored
                  communication across platforms, audiences, and emotional tones with single-click precision.
                  These guides cover every corner of the platform — from your first message to advanced
                  workflows.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setTab("workspace")} className="gap-2">
                    <Wand2 className="w-4 h-4" /> Open Document Workspace
                  </Button>
                  <Button variant="outline" onClick={handleCreate} className="gap-2">
                    <Plus className="w-4 h-4" /> Generate New Document
                  </Button>
                </div>
              </div>
            </Card>

            {/* Guides layout: sidebar + content */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
              {/* Sidebar */}
              <div className="lg:sticky lg:top-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                  <Input
                    value={guideQuery}
                    onChange={(e) => {
                      const q = e.target.value;
                      setGuideQuery(q);
                      // When the active guide is filtered out of the results, jump
                      // to the first matching guide so the content pane stays in sync.
                      const trimmed = q.trim().toLowerCase();
                      if (trimmed) {
                        const matches = GUIDES.filter(
                          (g) =>
                            g.title.toLowerCase().includes(trimmed) ||
                            g.summary.toLowerCase().includes(trimmed) ||
                            g.keywords.some((k) => k.includes(trimmed))
                        );
                        if (matches.length > 0 && !matches.some((m) => m.id === guideId)) {
                          selectGuide(matches[0].id);
                        }
                      }
                    }}
                    placeholder="Search documentation…"
                    className="pl-9 pr-9"
                    aria-label="Search documentation"
                  />
                  {guideQuery && (
                    <button
                      onClick={() => setGuideQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
                      aria-label="Clear search"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Card className="border-border/40 shadow-card">
                  <CardContent className="p-2">
                    {visibleGuides.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No guides match &quot;{guideQuery}&quot;
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {visibleGuides.map((g) => {
                          const Icon = g.icon;
                          const isActive = g.id === activeGuide.id;
                          return (
                            <button
                              key={g.id}
                              onClick={() => selectGuide(g.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-all",
                                isActive
                                  ? "bg-primary/10 text-foreground border border-primary/20"
                                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                              )}
                            >
                              <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                              <span className="flex-1 truncate font-medium">{g.title}</span>
                              {isActive && <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Content */}
              <div className="min-w-0">
                <Card className="border-border/40 shadow-editorial">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                        <activeGuide.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">{activeGuide.title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{activeGuide.summary}</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/30 my-5" />
                    <div className="space-y-5">{activeGuide.body}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start">
          {/* Document list */}
          <Card className="lg:sticky lg:top-0">
            <CardContent className="p-3">
              {loading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : docs.length === 0 ? (
                <EmptyState
                  title="No documents yet"
                  description="Create your first document to start writing with AI."
                  action={<Button size="sm" onClick={handleCreate}><Plus className="w-3.5 h-3.5 mr-1" />Create</Button>}
                />
              ) : (
                <div className="space-y-1">
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => { setActiveId(doc.id); setView("edit"); }}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all",
                        doc.id === activeId
                          ? "bg-primary/10 text-foreground border border-primary/20"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span>{doc.emoji ?? "📝"}</span>
                      <span className="flex-1 truncate">{doc.title}</span>
                      {doc.pinned && <Pin className="w-3 h-3 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          {active ? (
            <Card>
              <CardContent className="p-5">
                {/* Title row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="relative">
                    <button
                      onClick={() => setEmojiOpen((v) => !v)}
                      className="w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted/80 border border-border/40 flex items-center justify-center text-lg transition-all"
                      aria-label="Change emoji"
                    >
                      {active.emoji ?? "📝"}
                    </button>
                    {emojiOpen && (
                      <div className="absolute top-11 left-0 z-20 grid grid-cols-5 gap-1 p-2 rounded-xl border border-border/40 bg-popover shadow-xl">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center text-base"
                            onClick={() => { patchDoc(active.id, { emoji: e }); setEmojiOpen(false); }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={active.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, title: v } : d)));
                      if (saveTimer.current) clearTimeout(saveTimer.current);
                      saveTimer.current = setTimeout(() => patchDoc(active.id, { title: v }), 600);
                    }}
                    className="flex-1 min-w-[160px] h-10 font-semibold"
                  />
                  <div className="flex items-center gap-1.5 ml-auto">
                    {saving ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchDoc(active.id, { pinned: !active.pinned })}
                      className={cn(active.pinned && "text-primary")}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(active.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 mb-3 rounded-lg bg-muted/40 p-1 w-fit">
                  {(["edit", "preview"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                        view === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {v === "edit" ? <PencilLine className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {v === "edit" ? "Editor" : "Preview"}
                    </button>
                  ))}
                </div>

                {/* AI assist bar */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                    <Wand2 className="w-3.5 h-3.5 text-primary" /> AI
                  </span>
                  {AI_ACTIONS.map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant="outline"
                      disabled={aiLoading !== null || !markdownSource.trim()}
                      onClick={() => runAi(a.id)}
                      className="h-7 px-2.5 text-xs"
                    >
                      {aiLoading === a.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                      {a.label}
                    </Button>
                  ))}
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => e.target.value && runAiTone(e.target.value)}
                      disabled={aiLoading !== null || !markdownSource.trim()}
                      className="h-7 rounded-md border border-border/40 bg-background px-2 text-xs text-muted-foreground hover:text-foreground outline-none"
                    >
                      <option value="">Tone…</option>
                      {TONES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {markdownSource.split(/\n/).length} blocks
                  </Badge>
                </div>

                {/* Editor / Preview */}
                {view === "edit" ? (
                  <textarea
                    value={markdownSource}
                    onChange={(e) => handleContentChange(e.target.value)}
                    spellCheck={false}
                    className="w-full h-[520px] resize-none rounded-xl border border-border/40 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/50 outline-none p-4 font-mono text-sm leading-relaxed"
                    placeholder="Write in Markdown… (## headings, - bullets, 1. numbers, **bold**)"
                  />
                ) : (
                  <div className="h-[520px] overflow-y-auto rounded-xl border border-border/40 bg-muted/20 p-6 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownSource || "*Nothing to preview yet.*"}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  title="Select or create a document"
                  description="Pick a document from the list or create a new one."
                  action={<Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1.5" />New Document</Button>}
                />
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
