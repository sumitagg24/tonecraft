# 🎙️ ToneCraft

**AI-powered voice & tone transformation studio** — rewrite anything in 40+ intentional voices, run specialized AI agents, automate recurring writing tasks, and organize your work across documents, tasks, and calendars. Built for writers, marketers, creators, and teams who care about *how* things are said.

> **v1.1.0** — Phase 10 "AI Productivity Platform" (AI Workspace, Agents, Automations, Productivity suite, OAuth integrations)

---

## ✨ Features

### Compose — the writing surface
- Chat with tone-aware AI across multiple providers (Groq, OpenRouter, Google AI, OpenAI, Anthropic) with automatic provider routing
- 40+ purpose-built writing tools (rewrite, reply, social, email, business, career, dating, utility) with a dedicated **Tools** catalog page
- Tone & persona pickers, model selection, knowledge attachments, streaming responses
- Prompt Library with collections, tags, favorites, versioning, sharing, and ratings

### 🧠 AI Workspace
- **Documents** (`/docs`) — markdown editor with live preview, GFM support, block-based editing, debounced autosave, and an AI-assisted editing bar (rewrite, summarize, expand, grammar, continue, plan, 6 tone rewrites)
- **Notes** (`/notes`) — color-coded, pinnable quick notes
- **Tasks** (`/tasks`) — list view + Kanban board with priority and due dates
- **Calendar** (`/calendar`) — month grid, events, and AI meeting-notes generation (transcript → decisions/action items → push to calendar)

### 🤖 AI Agents (`/agents`)
- Create specialized agents (system prompt, role, icon, color) or use presets (Writer, Editor, Researcher, Summarizer, Planner)
- Multi-agent **chaining** — output feeds the next agent, per-step results stored
- Per-agent **memory** (last runs recalled), run history with status/duration/chain steps

### ⏰ Automations (`/automations`)
- Recurring AI tasks: daily / weekly / custom-cron triggers, run-now, enable toggle
- **Background worker** (`/api/cron/automations`) executes due automations every 5 minutes with race-safe atomic claiming, rate-limit respect, and failure rescheduling
- Workflow builder (Trigger → AI task → Output → Notify) with real in-app + realtime notifications
- Daily maintenance worker (`/api/cron/daily`): usage counter resets + notification digests

### 🔌 Integrations (`/integrations`)
- Slack + GitHub with **real OAuth** (state-cookie protected, CSRF-safe code exchange); connect/disconnect state persisted
- Drive, Notion, Discord, Gmail, Calendar cards with scopes (simulated flow when creds aren't configured)

### 👥 Workspaces & collaboration
- Multi-member workspaces with roles (member / manager / admin) and permission middleware
- Invites by email with tokens and expiry, activity feeds, presence, typing indicators
- Real-time via Socket.IO + WebSocket (SSE fallback), version snapshots, conflict resolution

### 🛠️ Platform
- Clerk auth (email + social), Paddle billing (Free / Pro / Enterprise) with webhooks
- Enterprise audit logging + **admin dashboard** (metrics, permissions, audit, storage, credits, AI usage)
- Rate limiting (Upstash), file uploads (Cloudflare R2), usage analytics

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (React 19)                           │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐   │
│  │  App Shell │ │ Dashboard  │ │  Public marketing    │   │
│  │  rail+⌘K   │ │  pages     │ │  pages               │   │
│  └────────────┘ └────────────┘ └──────────────────────┘   │
│  API routes: /api/** (withApiHandler, Zod-validated)       │
│  Background: /api/cron/** (CRON_SECRET-guarded)            │
│  Realtime: /api/socket, /api/ws (Socket.IO + WebSocket)    │
├────────────────────────────────────────────────────────────┤
│  Services layer (business logic)                           │
│  Repositories (data access)  →  Zustand stores (client)   │
│  AI engine: provider router → Groq/OpenRouter/Google/...  │
├────────────────────────────────────────────────────────────┤
│  Prisma 7 + Neon PostgreSQL (pooled + direct endpoints)   │
│  Upstash Redis (rate limits) · Cloudflare R2 (uploads)    │
└────────────────────────────────────────────────────────────┘
```

**Layering:** pages → API routes → services → repositories → Prisma. Server components for public pages; client components for the dashboard shell. All AI endpoints run through `checkMessageLimit` (Upstash) and plan-based affordability checks.

**Key directories**

| Path | Purpose |
|---|---|
| `src/app/(dashboard)/` | Authenticated pages (`/chat`, `/tools`, `/docs`, `/agents`, `/automations`, `/tasks`, `/notes`, `/calendar`, `/integrations`, `/admin`, …) |
| `src/app/api/` | Route handlers (auth-protected via `withApiHandler`) |
| `src/services/` | Business logic (`AgentService`, `AutomationService`, `IntegrationService`, `NotificationService`, …) |
| `src/repositories/` | Data access (`PromptRepository`, `WorkspaceRepository`, …) |
| `src/engine/` | AI provider router, model registry, tool calling |
| `src/components/` | UI: `shell/` (rail, topbar, palette), `tools/`, `workspace/`, `collaboration/`, `ui/` |
| `src/hooks/` | Client data hooks (`use-chat`, `use-documents`, `use-command-palette`, …) |
| `src/lib/` | Shared utilities (`prisma`, `ratelimit`, `cron-guard`, `integrations/oauth`, `validators`) |
| `prisma/schema.prisma` | 51 models: User, Chat, Persona, Knowledge, Prompt library, Workspaces, AuditLog, Document, Note, Task, CalendarEvent, Agent, AgentRun, Automation, Integration, … |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database
- Clerk account (auth)
- At least one AI provider key (Groq is the fastest free tier)

### Install

```bash
git clone https://github.com/sumitagg24/tonecraft.git
cd tonecraft
npm install          # runs `prisma generate` automatically
```

### Configure environment

Copy `.env.example` to `.env.local` and fill in the values (full reference below):

```bash
cp .env.example .env.local
```

### Database

```bash
npx prisma db push   # dev — push schema to Neon
# or, for managed migrations:
npx prisma migrate dev
```

### Run

```bash
npm run dev          # http://localhost:3000
```

Sign in with Clerk, and you're on `/chat`. The shell rail + ⌘K palette navigate everywhere.

---

## 🔐 Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled endpoint (PgBouncer) — runtime |
| `DIRECT_URL` | ✅ | Neon direct endpoint — Prisma CLI |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` | | `/sign-in`, `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` | | Redirect after auth (`/chat`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `SIGN_UP_FALLBACK_REDIRECT_URL` | | Fallback redirects (`/chat`) |
| `CLERK_WEBHOOK_SECRET` | | Clerk webhook verification |
| `GROQ_API_KEY` | ⚠️ | Primary AI provider (at least one provider key needed) |
| `OPENROUTER_API_KEY` | | Fallback provider, multi-model |
| `GOOGLE_AI_API_KEY` | | Secondary provider |
| `OPENAI_API_KEY` | | Pro-tier provider |
| `ANTHROPIC_API_KEY` | | Pro-tier provider |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Rate limiting (fails closed in prod when unset) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | Rate limiting |
| `CRON_SECRET` | ⚠️ | Bearer secret for `/api/cron/*` workers (Vercel sends automatically) |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | | Real OAuth for Slack integration |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | | Real OAuth for GitHub integration |
| `PADDLE_API_KEY` / `PADDLE_CLIENT_TOKEN` / `PADDLE_WEBHOOK_SECRET` | | Billing |
| `PADDLE_PRICE_PRO` / `PADDLE_PRICE_ENTERPRISE` | | Price IDs |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | | File storage |
| `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | | File storage |
| `NEXT_PUBLIC_APP_URL` | | Canonical app URL |

⚠️ = required for the feature to work in production; the app fails closed (rate limits, workers) rather than running unguarded.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |

---

## ☁️ Deployment (Vercel)

1. Push to GitHub, import the repo in Vercel
2. Set all env vars from `.env.example` (Neon `DIRECT_URL`, Clerk keys, `CRON_SECRET`, provider keys)
3. Deploy — `vercel.json` automatically registers the two cron jobs:
   - `*/5 * * * *` → `/api/cron/automations`
   - `0 9 * * *` → `/api/cron/daily`
4. Verify post-deploy: sign-in flow, an AI chat, an automation run-now, and (if configured) a Slack/GitHub connect

---

## 🧪 Testing

```bash
npm test            # Jest — 41 tests (validators + automation worker)
```

Worker unit tests cover the scheduled-automation paths: atomic claim race (concurrent workers run each automation exactly once), rate-limit skip + reschedule, and failure reschedule without a false `lastRunAt`.

---

## 🗺️ Roadmap

**Done**
- Phase 5–6: Chat, prompts, personas, knowledge, workspaces, collaboration
- Phase 7–8: Admin/audit, billing, production hardening, type-safety sweep
- Phase 10: AI Workspace (docs), Agents, Automations + workers, Productivity suite, real OAuth, grouped nav + ⌘K-everywhere, tools page polish

**Next (Phase 11+)**
- Token encryption at rest + GitHub OAuth refresh flow
- Dead-code sweep & bundle-size optimization
- Infinite canvas for the document workspace
- Deeper RAG (long-term memory, live web research mode)
- More real OAuth providers (Notion, Google Drive, Discord, Gmail)
- Performance: first-load budget, AI latency benchmarks, query tuning

---

## 📸 Screenshots

_Placeholders — add captures of the landing page, chat composer, tools grid, docs editor, agents, automations, and the admin dashboard._

---

## 🤝 Contributing

1. Fork & branch (`feat/your-feature`)
2. Keep the layered architecture (routes → services → repositories)
3. Run `npm run lint`, `npm test`, and `npm run build` before opening a PR
4. Match the existing design tokens (see `design-system/MASTER.md`)

---

## 📄 License

Built with Next.js 16, React 19, Prisma 7, Tailwind CSS 4, Clerk, and Paddle. Licensing to be confirmed — see the project owner before reuse.
