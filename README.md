# 🎙️ ToneCraft

**AI-powered voice & tone transformation studio** — rewrite anything in 40+ intentional voices, run specialized AI writing tools, and organize your work across documents, tasks, and calendars. Built for writers, marketers, creators, and teams who care about *how* things are said.

> **v1.1.4** — premium editorial redesign, USD Paddle billing, voice dictation, and a full e2e QA suite.

---

## ✨ Features

### Compose — the writing studio
- Tone-aware AI chat with automatic model routing and failover — one transparent engine, zero configuration
- 40+ purpose-built writing tools (rewrite, reply, social, email, business, career, utility) with a dedicated **Tools** catalog page
- Tone & persona pickers, knowledge attachments, streaming responses, inline edit, regenerate, copy, and feedback
- **Voice dictation** in the composer (browser STT), plus text-to-speech and image understanding on compatible endpoints
- Prompt Library with collections, tags, favorites, versioning, sharing, and ratings

### 🧠 AI Workspace
- **Documents** (`/docs`) — markdown editor with live preview, GFM support, block-based editing, debounced autosave, and an AI-assisted editing bar (rewrite, summarize, expand, grammar, continue, plan, 6 tone rewrites)
- **Notes** (`/notes`) — color-coded, pinnable quick notes
- **Tasks** (`/tasks`) — list view + Kanban board with priority and due dates
- **Calendar** (`/calendar`) — month grid, events, and AI meeting-notes generation

### 👥 Workspaces & collaboration
- Multi-member workspaces with roles (member / manager / admin) and permission middleware
- Invites by email with tokens and expiry, activity feeds, presence, typing indicators
- Real-time via Socket.IO + WebSocket (SSE fallback), version snapshots, conflict resolution

### 🛠️ Platform
- Clerk auth (email + social), Paddle billing (Free / Pro / Enterprise) with webhooks and annual plans
- **USD pricing** — Pro at $6/mo, Enterprise at $15/mo (sandbox); invoices and payment health checks in-app
- Enterprise audit logging + **admin dashboard** (metrics, permissions, audit, storage, credits, AI usage)
- Rate limiting (Upstash Redis), file uploads (Cloudflare R2), usage analytics
- AI provider identities are **never disclosed** in the product — users see one neutral writing engine

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
│  AI engine: provider router → cloud AI + local fallback   │
├────────────────────────────────────────────────────────────┤
│  Prisma 7 + Neon PostgreSQL (pooled + direct endpoints)   │
│  Upstash Redis (rate limits) · Cloudflare R2 (uploads)    │
└────────────────────────────────────────────────────────────┘
```

**Layering:** pages → API routes → services → repositories → Prisma. Server components for public pages; client components for the dashboard shell. All AI endpoints run through `checkMessageLimit` (Upstash) and plan-based affordability checks.

**Key directories**

| Path | Purpose |
|---|---|
| `src/app/(dashboard)/` | Authenticated pages (`/chat`, `/tools`, `/docs`, `/tasks`, `/notes`, `/calendar`, `/admin`, …) |
| `src/app/api/` | Route handlers (auth-protected via `withApiHandler`) |
| `src/services/` | Business logic (`ToolService`, `NotificationService`, `VoiceService`, …) |
| `src/repositories/` | Data access (`PromptRepository`, `WorkspaceRepository`, …) |
| `src/engine/` | AI provider router, model registry, tool calling |
| `src/components/` | UI: `shell/` (rail, topbar, palette), `tools/`, `workspace/`, `landing/`, `ui/` |
| `src/hooks/` | Client data hooks (`use-chat`, `use-command-palette`, `use-user-profile`, …) |
| `src/lib/` | Shared utilities (`prisma`, `ratelimit`, `ai-labels`, `validators`) |
| `e2e/` | Playwright smoke tests (hydration, signed-in chat flow, composer controls) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database
- Clerk account (auth)
- At least one AI provider API key (see `.env.example`)

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
| `CLERK_WEBHOOK_SECRET` | | Clerk webhook verification |
| AI provider API keys | ⚠️ | At least one required — the exact list lives in `.env.example` |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Rate limiting (fails closed in prod when unset) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | Rate limiting |
| `CRON_SECRET` | ⚠️ | Bearer secret for `/api/cron/*` workers |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | | Real OAuth for Slack integration |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | | Real OAuth for GitHub integration |
| `PADDLE_API_KEY` / `PADDLE_CLIENT_TOKEN` / `PADDLE_WEBHOOK_SECRET` | | Billing |
| `PADDLE_PRICE_PRO` / `PADDLE_PRICE_ENTERPRISE` | | Monthly price IDs |
| `PADDLE_PRICE_PRO_ANNUAL` / `PADDLE_PRICE_ENTERPRISE_ANNUAL` | | Annual price IDs (20% off toggle) |
| `NEXT_PUBLIC_APP_URL` | | Canonical app URL |
| `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | | Error monitoring + source maps |

⚠️ = required for the feature to work in production; the app fails closed (rate limits, workers) rather than running unguarded.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run check:deadcode` | Fail on unused source modules (components/hooks/stores/lib) |
| `npm test` | Jest unit tests |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed the database (marketplace demo data) |

---

## ☁️ Deployment (Vercel)

1. Push to GitHub, import the repo in Vercel
2. Set all env vars from `.env.example` (Neon `DIRECT_URL`, Clerk keys, `CRON_SECRET`, provider keys)
3. Deploy — `vercel.json` automatically registers the two cron jobs:
   - `*/5 * * * *` → `/api/cron/automations`
   - `0 9 * * *` → `/api/cron/daily`
4. Verify post-deploy: sign-in flow, an AI chat, a Paddle checkout, and the in-app billing health check

---

## 🧪 Testing

```bash
npm test            # Jest — unit tests (validators, automation worker, stores)

# Playwright e2e against the PRODUCTION server on :3100
npm run smoke       # build + full suite: desktop, Android (Pixel 7), iOS (iPhone 13), iPad (Pro 11)
npm run smoke:mobile # build + phone/tablet viewport projects only (fast release check)

# Run specific specs against the current build
npx playwright test                       # hydration/console smoke on all viewports
E2E_STORAGE_STATE=./.auth/state.json npx playwright test e2e/chat-flow.spec.ts

# Re-mint the saved Clerk session when the __session JWT goes stale (clerk-js
# refreshes it from the db session on page load) — requires a running server:
npm run start -- -p 3100   # in another terminal
node scripts/refresh-e2e-session.cjs
```

**CI (pull requests):** Playwright runs as a **matrix job with one job per viewport** — `e2e (chromium)`, `e2e (mobile-android)`, `e2e (mobile-ios)`, `e2e (tablet-ios)` — so failures are reported per-project (a mobile-only regression shows up as exactly which phone/tablet form factor broke). `fail-fast` is disabled so one failing viewport never cancels the others. The production build is built **once** in the `build-and-test` job and shared with every matrix entry via `actions/cache` (keyed on the commit SHA) — no per-viewport rebuilds. The mobile/tablet jobs are a mandatory, separate gate: hydration on every phone/tablet viewport plus the auth-free responsive checks always execute. When an e2e job fails, its **browsable HTML report and traces** are uploaded as a `playwright-<viewport>` artifact on the run (download it from the failed job's Summary page — `playwright-report/index.html` for the report, `test-results/` for raw traces viewable with `npx playwright show-trace`). Enable the jobs with the `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` repo secrets (required to render pages). To also run the **signed-in** checks (touch composer, reply action bar, protected pages, chat flow) on every PR, add a password-verified test account as `E2E_EMAIL` + `E2E_PASSWORD` repo secrets — without them those specs skip with a hint.

The e2e suite covers:
- **Hydration smoke** — landing, sign-in, and sign-up render with zero console/hydration errors (desktop, tablet, and both phone viewports)
- **Signed-in smoke** — protected pages (docs, admin, calendar, settings) render clean
- **Chat flow** — New Workspace → send → copy, asserting the clipboard contents
- **Composer controls** — tone picker, tool picker, voice dictation (fake media stream), edit + `(edited)` marker, regenerate
- **Responsive overflow** (all projects) — public pages must fit the viewport with no horizontal scroll; at tablet width (834px) this covers the md breakpoint between the phone and desktop layouts
- **Mobile responsive** (`mobile-android` / `mobile-ios` projects) — composer send button stays on-screen, toolbar scrolls on small screens, tone picker opens as a touch bottom sheet, share menu opens on tap, reply action bar (Copy/Regenerate) visible and tappable without hover

Clerk's dev instance requires a one-time email code for new devices; the signed-in specs use a captured session in `.auth/state.json` (gitignored) or skip gracefully when it's absent.

---

## 🗺️ Roadmap

**Done**
- Chat studio, tones, personas, prompt library, knowledge base, workspaces, collaboration
- Tools catalog (40+ tools), docs/notes/tasks/calendar suite
- Admin dashboard, audit logs, Paddle billing (USD monthly + annual), voice dictation
- Provider-neutral engine — users never see which model produced their results
- Playwright e2e + dead-code CI checks, Sentry monitoring

**Next**
- Token encryption at rest + OAuth refresh flows
- Marketplace release (publish/install prompts, agents, personas)
- Deeper RAG (long-term memory, live web research mode)
- More real OAuth providers (Notion, Google Drive, Discord, Gmail)
- Performance: first-load budget, AI latency benchmarks, query tuning

---

## 🤝 Contributing

1. Fork & branch (`feat/your-feature`)
2. Keep the layered architecture (routes → services → repositories)
3. Run `npm run lint`, `npm run typecheck`, `npm run check:deadcode`, and `npm run build` before opening a PR
4. Match the existing design tokens (see `design-system/MASTER.md`)

---

## 📄 License

Built with Next.js 16, React 19, Prisma 7, Tailwind CSS 4, Clerk, and Paddle. Licensing to be confirmed — see the project owner before reuse.
