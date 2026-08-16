# Production Dependencies & Integrations Audit — 13

Date: 2026-08-17 · Scope: every production dependency traced from code → environment variable → runtime behavior. Verified directly against source, `package.json`, `.env*` key presence, and deployment config — **not** from README claims. Covered: Cloudflare R2 uploads/deletes/downloads, Upstash Redis rate limiting, Clerk production auth, Neon database connectivity, Paddle webhooks/billing, cron authentication + scheduling, AI provider keys and usage limits, Sentry, and API authorization across all routes.

**TL;DR:** the core platform (auth, DB, rate limiting, billing, AI, Sentry, HTTP API authorization) is real and well-hardened. Three features are dead in production (R2, scheduled background work, realtime), two are silently degraded (embeddings, email/push), and there is one concrete webhook bug. `npx tsc --noEmit --incremental false` is clean; the Prisma schema covers every service.

---

## Verification summary

| Dependency | Status | Evidence |
|---|---|---|
| Cloudflare R2 uploads/deletes/downloads | ✅ **Implemented 2026-08-17** | `src/lib/storage.ts` + `/api/upload` + `/api/files/[...key]`; composer attachments restored; knowledge originals persisted (see Resolved #9) |
| Upstash Redis rate limiting | ✅ Real, fully wired | `src/lib/ratelimit.ts` (fail-closed in prod); `withApiHandler`, `src/proxy.ts`, chat route, `ProviderRouter`; `UPSTASH_REDIS_REST_URL/TOKEN` set |
| Clerk production auth | ✅ Real | `src/proxy.ts` `clerkMiddleware` + `auth.protect()`; `src/lib/auth.ts` lazy-sync; `/api/webhook/clerk` svix-verified; keys set |
| Neon database (Prisma 7) | ✅ Real | `src/lib/prisma.ts` (`@prisma/adapter-pg`, `DIRECT_URL`); `DATABASE_URL`/`DIRECT_URL` set |
| Paddle webhooks/billing | ✅ Real, **1 bug** | `PaddleProvider.ts` + `/api/billing/webhook` (duplicate `subscription.payment_succeeded` case) |
| Cron auth | ✅ Guard real + hardened | `src/lib/cron-guard.ts` (timing-safe CRON_SECRET bearer + Vercel schedule-header/UA verification) |
| Cron scheduling | ❌ **Broken** | `vercel.json` scheduled only `/api/cron/daily`; automations + queue never ran (fixed 2026-08-17, see Resolved) |
| AI providers + usage limits | ✅ Real, 2 caveats | `ProviderRouter.ts`, `UsageGuard.ts`; local-template fallback + hash-vector embeddings |
| Sentry | ✅ Real | `instrumentation.ts`, `sentry.{server,edge}.config.ts`, `withSentryConfig`; DSNs/token set |
| API authorization (HTTP) | ✅ Strong | `withApiHandler` (auth-default, zod, 3-tier rate limits, feature gates, ownership checks) |
| API authorization (realtime) | ❌→✅ Fixed | Socket.IO JWT placeholder + `/api/ws` missing membership check (fixed 2026-08-17, see Resolved) |

---

## Findings

### F1. Cloudflare R2 — previously REMOVED, now fully IMPLEMENTED (2026-08-17)

R2 was deleted in v1.5.0 (composer attach button removed, `e2e/composer-attach-removed.spec.ts` asserted its absence). Reimplemented end-to-end on top of the S3-compatible API — see Resolved #9. The `docker-compose.yml` local `redis` service remains unused (app uses Upstash REST only) — cosmetic leftover.

### F2. Upstash Redis rate limiting — REAL (no action)

Full sliding-window implementation; **fails closed in production** when unconfigured (`unconfiguredCheck()` returns `allowed:false`). Wired into: `withApiHandler` (per-IP + per-user + per-endpoint on every API call), `proxy.ts` (auth-attempt throttling with exponential backoff), the chat route (`checkMessageLimit`), and `ProviderRouter` (per-provider budget). Health-checked via `ProviderHealthService.checkRedis`.

### F3. Clerk production auth — REAL (no action)

`clerkMiddleware` + `auth.protect()` in `src/proxy.ts`; `withApiHandler` requires auth by default; `auth()` (`src/lib/auth.ts`) lazy-syncs users (temp email until webhook fires); `/api/webhook/clerk` verifies svix signatures with `CLERK_WEBHOOK_SECRET`. Keys set locally and wired into CI secrets. Minor: `startup-validation.ts` only treats `CLERK_SECRET_KEY` as critical — a missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` breaks the client bundle without failing the boot check.

### F4. Neon database — REAL (no action)

Prisma 7 + `@prisma/adapter-pg`; runtime uses `DIRECT_URL` (avoids pooler staleness), tuned pool (max 5, short timeouts, `maxUses`, channel binding), SSL-mode normalization. All 60+ models used by services exist in `prisma/schema.prisma`.

### F5. Paddle webhooks/billing — REAL with a bug (P0)

Full SDK provider, signature verification, live/sandbox key detection, hardened access gating (PlanService grants active/trialing/past_due only), ownership-bound checkout (`customData.userId` = session user).

**Bug — `src/app/api/billing/webhook/route.ts`: `case "subscription.payment_succeeded"` appears twice.** The first (dead) case executes: it writes a mislabeled `billing.unsubscribe` audit entry and **never flips the subscription to active**; the correct activation code is unreachable. `transaction.completed`/`transaction.paid` therefore can't activate a subscription through this path. Compiles because TS doesn't flag duplicate case labels.

### F6. Cron authentication — guard real, scheduling was broken (P0, fixed)

`guardCronRequest` (`src/lib/cron-guard.ts`) is correct: timing-safe `CRON_SECRET` bearer comparison, used by all three workers (`/api/cron/daily`, `/api/cron/automations`, `/api/cron/queue`).

- **Scheduling:** `vercel.json` previously registered only `/api/cron/daily`. The automations and queue workers were never invoked — scheduled automations never ran and the background queue never drained. (Fixed 2026-08-17 — see Resolved.)
- **Queue dispatch is mostly a no-op even when drained** (`src/app/api/cron/queue/route.ts`): `email` = placeholder log (no SMTP transport exists — `nodemailer` is installed but never imported, no SMTP env vars), `embedding` = log only, `notification`/`analytics` = log only, `export` = marks complete.

### F7. AI providers & usage limits — REAL with 2 caveats (P1)

Real: AI SDK v4 clients for groq/google/openrouter/openai (keys set; **`ANTHROPIC_API_KEY` is dead** — Claude routes via OpenRouter per `src/config/models.ts`), current model IDs, provider failover with retries + idle timeout, per-provider rate budget, and **dual usage limits** — Upstash windows (free 10/hr, 50/day; pro 100/hr) via `checkMessageLimit` plus a monthly credit ledger via `usageGuard` (`FOR UPDATE` transactions, pre-check min / post-record actual).

Caveats:
- **`LocalToneEngine` fallback** (`src/engine/LocalToneEngine.ts`): when *all* cloud providers fail, the engine silently returns template-based canned text ("Dear Team…") and charges 1 credit. Misconfigured/invalid API keys are masked as fake output instead of surfaced as errors. `isRetryable` in `ProviderRouter.ts` treats "unauthorized"/"invalid key" as retryable, guaranteeing the fallback triggers.
- **Embeddings are degraded**: `EMBEDDINGS_API_URL/KEY` are **not set** (only in `.env.example`), so `MemoryService` uses deterministic hash vectors. `KnowledgeService` never calls `embed()` — retrieval is lexical (`searchScore` in `src/lib/knowledge/chunk.ts`) — and its queued "embedding" jobs are no-ops. A configured provider wouldn't help knowledge until this is wired.

### F8. Sentry — REAL (no action)

SDK initialized client/server/edge, `onRequestError` captures RSC + route errors with Clerk user attribution (`src/instrumentation.ts`), `withSentryConfig` uploads source maps, `logger.error` → Sentry. DSNs, org, project, auth token set.

### F9. API authorization — strong for HTTP, was broken for realtime (fixed)

HTTP layer is solid: `withApiHandler` (auth default true, zod validation, per-IP + per-user + per-endpoint rate limits, feature gates, Sentry user linking), ownership checks (`findByIdAndUser`/`{userId}` filters) on personal resources, workspace membership + role checks on workspace routes, sanitized errors.

Remaining weaknesses (not yet fixed):

- **`src/middleware/permissionMiddleware.ts`** — verified current (2026-08-17): `requireWorkspaceRole`/`requireProjectRole`/`checkWorkspaceRole`/`isWorkspaceMember` are all real, with the admin ≥ manager ≥ member hierarchy (`ROLE_RANK`); used by every workspace + admin route (all map `"none"`/`"denied"` → 403). The earlier "empty stub" claim was stale.
- **Email + push notifications are no-ops** (`src/services/NotificationService.ts`): `sendEmail` enqueues to the placeholder handler; `sendPush` only logs (no web-push/VAPID). Only in-app + SSE work.

---

## Resolved since this review (2026-08-17)

1. **Cron scheduling (F6)** — `vercel.json` now registers all three workers: `/api/cron/automations` (`*/5 * * * *`), `/api/cron/daily` (`0 9 * * *`), `/api/cron/queue` (`* * * * *`). README deployment section updated to match, with a note that sub-daily schedules require a Vercel Pro plan or higher.
2. **Socket.IO auth (F9)** — `src/lib/socket.ts` and `src/app/api/socket/route.ts` now verify the handshake JWT with Clerk's `verifyToken` (signature + `exp`/`nbf` against the Clerk JWKS) and derive the identity from `claims.sub`. The placeholder `validateSocketToken` (accepted any ≥10-char token, parsed `userId:name:image` out of it) is deleted. Client (`src/lib/socket/index.ts`) sends the real `__session` cookie token and no longer transmits a client-claimed `userId`.
3. **`/api/ws` authorization (F9)** — the route now verifies `permissionMiddleware.isWorkspaceMember(workspaceId, userId)` and returns 403 for non-members.
4. **README drift** — verified current README no longer claims R2 uploads; deployment/cron section corrected (it previously claimed crons that were not registered).
5. **Paddle webhook (F5)** — removed the duplicate `subscription.payment_succeeded` case; `transaction.completed`/`transaction.paid` now activate the subscription (`src/app/api/billing/webhook/route.ts`).
6. **Queue handlers (F6/F7)** — `email` jobs now send via a real nodemailer SMTP transport (`src/lib/email.ts`, `SMTP_*` env vars added to `.env.example`); `embedding` jobs now embed each knowledge chunk and persist vectors in `KnowledgeChunk.embedding` (`KnowledgeService.embedFile`).
7. **AI fallback (F7)** — production no longer falls back to the LocalToneEngine template text when all providers fail: `generate()` throws / `stream()` yields an `AIEngineError` with a classified, user-safe message (`all_providers_exhausted` etc.), and no credits are charged. Dev keeps the local fallback; the chat route surfaces the engine's message instead of the generic apology.
8. **PDF ingestion (F1)** — installed `pdf-parse@2.4.5` (bundled types, no `@types` needed) and added a real PDF branch to `extractText` (`src/lib/knowledge/extract.ts`, now async): `PDFParse({ data })` + `getText()`, NUL stripping, and a `PdfParseError` for corrupt/encrypted/scanned files that the `/api/knowledge` route surfaces as 422 instead of a generic 500. `detectMimeType` maps `.pdf` → `application/pdf`; `pdf-parse` is in `serverExternalPackages` (`next.config.ts`) so its worker runs unbundled; `VisionService.parseDocument` now uses the v2 API (the old `eval("require")` + v1 call signature was dead). Regression test `src/__tests__/knowledge-extract.test.ts` builds a minimal valid PDF and asserts extraction (jest needs `--experimental-vm-modules` for pdf.js's fake worker — `test`/`test:watch` scripts updated accordingly).
9. **Cloudflare R2 (F1)** — fully implemented: `src/lib/storage.ts` (S3-compatible client; `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET`/`R2_PUBLIC_URL`); `POST /api/upload` (auth, magic-byte validation, per-plan size/daily/storage caps, usage accounting, fail-closed 503 when unconfigured); `GET /api/files/[...key]` (ownership enforced by `uploads/<userId>/` / `knowledge/<userId>/` key prefix); composer attach button + staged chips restored (`PremiumComposer`), attachments persisted on the message route (key-prefix ownership check, max 10) and rendered by `PremiumMessageCard`; knowledge uploads now persist the original file to R2 with graceful Postgres-chunks fallback, and `KnowledgeService.remove` deletes the object. `e2e/composer-attach.spec.ts` replaces the removal guard with a presence + send-flow guard.
10. **Cron auth (F6)** — hardened `guardCronRequest`: when a request carries Vercel's `x-vercel-cron-schedule` header it must be a valid cron expression and the user agent must start with `vercel-cron/` (spoofed-header rejection); manual invocations with a valid bearer secret still pass. `vercel.json` gained the `$schema`. New tests in `security-guards.test.ts`. Note: the schedule header/UA checks are the production path — Vercel sends them automatically alongside the `CRON_SECRET` Authorization header (set `CRON_SECRET` as a Vercel project env var).
11. **Feedback delivery** — the in-app feedback flow (TopBar button → `FeedbackDialog` → `POST /api/feedback` → `Feedback` table + admin triage at `/admin/feedback`, gated by `ADMIN_EMAILS`) is now documented end-to-end; submissions are emailed to `FEEDBACK_NOTIFICATION_EMAIL` via the queue's SMTP transport (recommended: create `feedback@tonecraft.app` and point the var at it).

## Remaining priority list

| # | Severity | Item | Location |
|---|---|---|---|
| 1 | P3 | Drop dead `ANTHROPIC_API_KEY` from env docs (Claude routes via OpenRouter) | `.env.example`, `README.md` |
| 2 | P3 | Remove unused `redis` container from `docker-compose.yml` (app uses Upstash REST only) | `docker-compose.yml` |
