# 🎙️ ToneCraft

**AI-powered voice & tone transformation studio** — rewrite anything in 10 built-in tones (or your own custom personas), run 40+ specialized AI writing tools, and organize your work across documents, tasks, and calendars. Built for writers, marketers, creators, and teams who care about *how* things are said.

> **v1.5.0** — production-launch hardening: live Paddle billing, production Clerk auth, in-app feedback with admin triage, webhook replay protection, retention cleanup, semantic knowledge retrieval, and a per-viewport e2e QA suite.

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
- **Knowledge base** — upload documents (PDF/text/markdown/CSV/HTML/JSON/XML, validated by extension + magic bytes, 25 MB cap) that ground AI responses; retrieval blends vector embeddings with lexical search when vectors exist, with a graceful lexical fallback and a daily embedding backfill for legacy files

### 👥 Workspaces & collaboration
- Multi-member workspaces with roles (member / manager / admin) and a real role hierarchy (admin ≥ manager ≥ member)
- Invites by email with tokens and expiry, activity feeds, presence, typing indicators
- Real-time via Socket.IO + WebSocket (SSE fallback), version snapshots, conflict resolution
- Every realtime and collaboration route re-verifies resource membership server-side — no client-claimed identities or cross-user reads

### 🛠️ Platform
- Clerk auth (email + social), **live Paddle billing** (Free / Pro / Enterprise) with webhooks and annual plans
- **USD pricing** — Pro at $6/mo, Enterprise at $15/mo; invoices and payment health checks in-app
- Enterprise audit logging + **admin dashboard** (metrics, permissions, audit, credits, AI usage)
- **In-app feedback** — bug / feature request / general / other, rating, optional context; triaged at `/admin/feedback` (new / reviewed / resolved) and emailed to `FEEDBACK_NOTIFICATION_EMAIL`
- **Webhook replay protection** — Paddle and Clerk events dedupe by event ID (`WebhookEvent` table), so replays never re-write audit logs
- **Retention & cleanup** — daily bounded cleanup of audit logs, activity, usage records, queue jobs, prompt history, and document operations (windows env-overridable)
- Rate limiting (Upstash Redis), usage analytics, Sentry error monitoring
- Scheduled background workers (usage resets, notification digests, automations, retention, embedding backfill) guarded by `CRON_SECRET`
- AI provider identities are **never disclosed** in the product — users see one neutral writing engine

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router (React 19)                           │
│  ┌────────────┐ ┌────────────┐ ┌──────────────────────┐   │
│  │  App Shell │ │  Dashboard │ │  Public marketing    │   │
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

**Layering:** pages → API routes → services → repositories → Prisma. Server components for public pages; client components for the dashboard shell. All AI endpoints run through `checkMessageLimit` (Upstash) and plan-based affordability checks. `/api/health` probes the real dependencies (database, Groq, Gemini, OpenRouter, Clerk, Paddle) with sanitized output.

**Key directories**

| Path | Purpose |
|---|---|
| `src/app/(dashboard)/` | Authenticated pages (`/chat`, `/tools`, `/docs`, `/tasks`, `/notes`, `/calendar`, `/admin`, …) |
| `src/app/(public)/` | Marketing pages (landing, pricing, features, status, help, …) |
| `src/app/api/` | Route handlers (auth-protected via `withApiHandler`) |
| `src/services/` | Business logic (`ToolService`, `NotificationService`, `VoiceService`, `PlanService`, `RetentionService`, `FeedbackService`, …) |
| `src/repositories/` | Data access (`PromptRepository`, `WorkspaceRepository`, `AuditLogRepository`, …) |
| `src/engine/` | AI provider router, model registry, tool calling, local tone engine |
| `src/billing/` | Billing abstraction (`BillingService`, Paddle provider, entitlement sync) |
| `src/components/` | UI: `shell/` (rail, topbar, palette), `tools/`, `workspace/`, `landing/`, `ui/`, `feedback/` |
| `src/hooks/` | Client data hooks (`use-chat`, `use-command-palette`, `use-notifications`, …) |
| `src/lib/` | Shared utilities (`prisma`, `ratelimit`, `ai-labels`, `validators`, `withApiHandler`, `admin`, `resource-access`) |
| `src/middleware/` | Role/permission checks for workspace routes |
| `src/__tests__/` | Jest unit + security suites (guards, feedback API, admin authz, webhook dedupe, retention, collaboration authz) |
| `e2e/` | Playwright specs (hydration, auth mount, chat flow, mobile viewports) |
| `scripts/` | Tooling (dead-code check, Paddle provisioning, e2e session refresh) |

**Security model**
- Every `/api/**` route runs through `withApiHandler`: session required by default, Zod body validation, sanitized errors, three-tier rate limits, feature gates
- Personal resources are ownership-scoped (`findFirst({ id, userId })`); workspace routes check membership + role; global admin actions are gated by `ADMIN_EMAILS` (fail closed when unset)
- Webhooks (Clerk svix, Paddle) verify signatures and dedupe by event ID; cron workers require the `CRON_SECRET` bearer token (timing-safe compare)
- Secrets live only in server env vars — never `NEXT_PUBLIC_*`; R2 credentials never reach the browser (uploads go through the server, downloads via `/api/files`)
- The app **fails closed**: missing rate-limit, cron, or storage config blocks the feature rather than running unguarded

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database (pooled + direct endpoints)
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
| AI provider API keys (`GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) | ⚠️ | At least one required |
| `EMBEDDINGS_API_URL` / `EMBEDDINGS_API_KEY` / `EMBEDDINGS_MODEL` | | Embeddings for AI memory + knowledge retrieval (unset = deterministic hash fallback) |
| `STT_MODEL` / `TTS_MODEL` / `TTS_VOICE` / `VISION_MODEL` | | Voice & vision model overrides (defaults via `OPENAI_API_KEY`) |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Rate limiting (fails closed in prod when unset) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | Rate limiting |
| `CRON_SECRET` | ⚠️ | Bearer secret for `/api/cron/*` workers |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | | Real OAuth for Slack integration |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | | Real OAuth for GitHub integration |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_FROM` | | SMTP transport for notification emails (queue worker) |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | | SMTP credentials (omit `SMTP_USER` for unauthenticated relays) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | ⚠️ | Cloudflare R2 — chat attachments + knowledge originals (upload route fails closed without it) |
| `R2_PUBLIC_URL` | | Public bucket domain for direct-read links (unset = private downloads via `/api/files`) |
| `ADMIN_EMAILS` | | Comma-separated global admin emails (feedback triage, `/admin/*`, collaboration maintenance) |
| `FEEDBACK_NOTIFICATION_EMAIL` | | Inbox for in-app feedback submissions (e.g. `feedback@tonecraft.app`) |
| `RETENTION_DAYS_QUEUEITEM` / `_AUDITLOG` / `_ACTIVITY` / `_NOTIFICATION` / `_USAGERECORD` / `_PROMPTHISTORY` / `_DOCUMENTOPERATION` | | Per-table retention windows in days (defaults: 30 / 365 / 180 / 365 / 365 / 365 / 180; `0` disables) |
| `RETENTION_DAYS_MESSAGE` / `RETENTION_DAYS_MEMORYITEM` | | Retention for user content — **disabled by default**, opt in only if you accept deleting user data |
| `RETENTION_MAX_ROWS_PER_RUN` | | Cap on rows deleted per daily retention run (default 100,000) |
| `PADDLE_API_KEY` / `PADDLE_CLIENT_TOKEN` / `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` / `PADDLE_WEBHOOK_SECRET` | | Billing |
| `PADDLE_PRICE_PRO` / `PADDLE_PRICE_ENTERPRISE` | | Monthly price IDs |
| `PADDLE_PRICE_PRO_ANNUAL` / `PADDLE_PRICE_ENTERPRISE_ANNUAL` | | Annual price IDs (20% off toggle) |
| `NEXT_PUBLIC_APP_URL` | | Canonical app URL |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | | Error monitoring + source maps |
| `E2E_EMAIL` / `E2E_PASSWORD` | | CI-only: signed-in e2e test account (specs skip when absent) |

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
| `npm run test:e2e` | Playwright test suite |
| `npm run smoke` | Build + full e2e suite (all viewports) |
| `npm run smoke:mobile` | Build + mobile/tablet viewport projects only |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed the database (marketplace demo data) |
| `npm run icons` | Regenerate PWA icons |

---

## ☁️ Deployment (Vercel)

1. Push to GitHub, import the repo in Vercel
2. Set all env vars from `.env.example` (Neon `DIRECT_URL`, Clerk keys, `CRON_SECRET`, provider keys)
3. Deploy — `vercel.json` registers the cron workers (all guarded by the `CRON_SECRET` bearer token):
   - `* * * * *` → `/api/cron/queue` — background queue drain (emails, exports, notifications, analytics, embeddings)
   - `*/5 * * * *` → `/api/cron/automations` — scheduled AI automations
   - `0 9 * * *` → `/api/cron/daily` — usage resets, notification digests, retention cleanup, embedding backfill, collaboration-storage compaction

   Note: sub-daily schedules (`* * * * *`, `*/5 * * * *`) require a Vercel Pro plan or higher — Hobby plans only run crons once per day.
4. Verify post-deploy: sign-in flow, an AI chat, a Paddle checkout, the in-app billing health check, and a feedback submission appearing in `/admin/feedback`

---

## 🧪 Testing

```bash
npm test            # Jest — unit + security tests (validators, automation worker, stores,
                    # security guards, feedback API, admin authz, webhook dedupe, retention,
                    # collaboration authz)

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

**CI (pull requests):** Playwright runs as a **matrix job with one job per viewport** — `e2e (chromium)`, `e2e (mobile-android)`, `e2e (mobile-ios)`, `e2e (tablet-ios)` — so failures are reported per-project (a mobile-only regression shows up as exactly which phone/tablet form factor broke). `fail-fast` is disabled so one failing viewport never cancels the others. The production build is built **once** in the `build-and-test` job and shared with every matrix entry via `actions/cache` (keyed on the commit SHA) — no per-viewport rebuilds. The mobile/tablet jobs are a mandatory, separate gate: hydration on every phone/tablet viewport plus the auth-free responsive checks always execute. When an e2e job fails, its **browsable HTML report and traces** are uploaded as a `playwright-<viewport>` artifact on the run (download it from the failed job's Summary page — `playwright-report/index.html` for the report, `test-results/` for raw traces viewable with `npx playwright show-trace`). Enable the jobs with the `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` repo secrets (required to render pages). To also run the **signed-in** checks (touch composer, reply action bar, protected pages, chat flow) and the billing/checkout spec on every PR, add a password-verified test account as `E2E_EMAIL` + `E2E_PASSWORD` and the Paddle secrets as repo secrets — without them those specs skip with a hint.

The e2e suite covers:
- **Hydration smoke** — landing, sign-in, and sign-up render with zero console/hydration errors (desktop, tablet, and both phone viewports)
- **Auth mount** — Clerk UI (identifier/password fields + Continue) mounts on `/sign-in` and `/sign-up`; optional sign-in form submission
- **Signed-in smoke** — protected pages (docs, admin, calendar, settings) render clean
- **Chat flow** — New Workspace → send → copy, asserting the clipboard contents
- **Composer controls** — tone picker, tool picker, voice dictation (fake media stream), edit + `(edited)` marker, regenerate
- **Billing/checkout** — `/billing` mount, bundle token↔build-config match, and the Paddle checkout probe
- **Responsive overflow** (all projects) — public pages must fit the viewport with no horizontal scroll; at tablet width (834px) this covers the md breakpoint between the phone and desktop layouts
- **Mobile responsive** (`mobile-android` / `mobile-ios` projects) — composer send button stays on-screen, toolbar scrolls on small screens, tone picker opens as a touch bottom sheet, share menu opens on tap, reply action bar (Copy/Regenerate) visible and tappable without hover

Clerk's dev instance requires a one-time email code for new devices; the signed-in specs use a captured session in `.auth/state.json` (gitignored) or skip gracefully when it's absent.

---

## 🗺️ Roadmap

**Done**
- Chat studio, tones, personas, prompt library, knowledge base (with semantic retrieval + embedding backfill), workspaces, collaboration
- Tools catalog (40+ tools), docs/notes/tasks/calendar suite
- Admin dashboard, audit logs, **live Paddle billing** (USD monthly + annual), voice dictation
- In-app feedback with admin triage + email notification; webhook replay protection; retention cleanup; production security hardening (IDOR/realtime/admin fixes, role hierarchy)
- Provider-neutral engine — users never see which model produced their results
- Mobile-first chat UI; per-viewport Playwright e2e (Android / iOS / tablet) + dead-code CI checks, Sentry monitoring

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
