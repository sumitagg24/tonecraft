# Production Launch Readiness Audit — 14

Date: 2026-08-17 · Scope: full production-readiness audit (auth, API authorization, cron, rate limiting, storage, database, AI, billing, env, general security) + the in-app feedback system + security tests. Verified directly against source and runtime behavior — **not** from README claims.

---

## A. Already implemented correctly (verified)

| Area | Verdict | Evidence |
|---|---|---|
| **Clerk auth** | ✅ | `src/proxy.ts` `clerkMiddleware` + `auth.protect()`; `withApiHandler` auth-by-default; svix-verified Clerk webhook (`/api/webhook/clerk`); lazy user sync with race-safe retry; `CLERK_SECRET_KEY` + publishable key split correctly. |
| **API authorization** | ✅ strong | 139/150 routes go through `withApiHandler` (zod validation, sanitized errors, per-IP + per-user + per-endpoint rate limits, feature gates). Ownership checks via `findFirst({ where: { id, userId } })` / service-level scoping on personal resources; workspace role checks on workspace/admin routes. |
| **Cron security** | ✅ | `guardCronRequest` — timing-safe `CRON_SECRET` bearer comparison, 401 wrong/missing, 503 unconfigured (fail closed). All three workers registered in `vercel.json` (`automations` */5, `daily` @9, `queue` *). |
| **Rate limiting** | ✅ | Upstash sliding windows; **fails closed in production** when unconfigured; wired globally (wrapper tiers + auth-attempt exponential backoff in proxy + `checkMessageLimit` plan caps + per-provider budgets). |
| **Paddle billing** | ✅ | Signature verification (`webhooks.unmarshal` + `PADDLE_WEBHOOK_SECRET`); sandbox/prod detection from key prefix; ownership-bound checkout (`customData.userId` from session, never body); entitlement sync with plan caching + invalidation; monthly + annual price IDs; past_due grace. |
| **AI cost control** | ✅ | Keys server-side only; max input sizes (10k chat / 30k assist); per-provider hourly budgets; credit ledger with `FOR UPDATE` transactions; idle timeout + client-abort; **production surfaces provider errors** (no canned LocalToneEngine fallback since the hardening commit). |
| **Upload validation** | ✅ | `src/lib/file-validation.ts` — extension allowlist + magic-byte sniffing + NUL/printable checks; 25 MB hard cap; per-plan caps; knowledge files stored in Postgres. |
| **R2 object storage** | ✅ (working tree) | `src/lib/storage.ts` — @aws-sdk/client-s3 against R2, `R2_*` env vars, fail-closed when unconfigured; KnowledgeService uploads with ownership-scoped keys (`knowledge/<userId>/…`) and ownership-checked deletes. (Audit 13 was stale — R2 was re-added in the uncommitted work.) |
| **Security headers** | ✅ | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, HSTS, Referrer-Policy, Permissions-Policy, production-only CSP with frame-ancestors 'none'. |
| **Secrets** | ✅ | `.env*` gitignored; `.env.example` contains **no** real values; no `NEXT_PUBLIC_*` secret keys (only publishable Clerk key, Paddle client token, APP_URL, Sentry DSN, socket URL). |
| **DB/Prisma** | ✅ | Prisma 7 + pg adapter with tuned pool; `DIRECT_URL` used; indexed hot paths; relations use `onDelete` cascades. |

## B. Broken / security issues found & fixed

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | **P1 IDOR** | `/api/share/[token]` **DELETE** revoked any share link by token with no ownership check — any signed-in user who knew a token could revoke someone else's link. | Delete now scoped to `{ token, userId }`; foreign tokens return 404 (no oracle). |
| 2 | **P2 functional** | `/api/share/[token]` **GET** required a session even though share links are public-by-token (the page lives in the public route group) — anonymous viewers got 401. | GET is now explicitly `auth: false` with per-IP rate limiting; DELETE stays authed + ownership-checked. |
| 3 | **P0 privilege escalation** | `/api/analytics/admin` "authorized" admins by checking `preferredModel` ∈ {auto, gpt-4, claude-3} — a user setting their own model preference gained access to **global** metrics (all users, chats, subscriptions). | Now gated on `isGlobalAdmin()` (`ADMIN_EMAILS` env, fail closed). |
| 4 | **P1 realtime authz** | `/api/socket` joined `project:`/`chat:` rooms and wrote `DocumentOperation` rows for **arbitrary resource ids** with no membership check; also stored the Clerk `sub` id in `User.id`-referencing columns (FK violation / mismatched ownership). | Identity now resolved Clerk id → DB user id; `join-project`/`join-chat`/`typing-*`/`cursor-move`/`document-operation` all verify project/chat access (owner, project member, or workspace member). |
| 5 | **P2 middleware** | `permissionMiddleware` had empty `requireWorkspaceRole`/`requireProjectRole` stubs and `checkWorkspaceRole` was exact-match only — an admin was denied manager-level actions. | Implemented real implementations + role hierarchy (admin ≥ manager ≥ member) and project membership resolution. |
| 6 | P2 vestigial | Empty `/api/upload`, `/api/auth`, `/api/messages/[messageId]/continue` dirs | Removed (untracked empty dirs). |
| 7 | P2 unbounded growth | Operational tables (QueueItem, AuditLog, Activity, Notification, UsageRecord, PromptHistory, DocumentOperation) had no cleanup | `RetentionService` + daily cron job with env-configurable windows; user-content tables (Message, MemoryItem) disabled by default. |
| 8 | P2 webhook replay | Paddle/Svix redelivery re-processed events and re-wrote audit logs | `WebhookEvent` table + `claimWebhookEvent`/`markWebhookProcessed` in both webhook routes (replays return early; crashed attempts retry). |
| 9 | P2 knowledge retrieval | Retrieval was lexical-only despite chunk embeddings being generated | `retrieve()` now blends vector cosine (0.7) with lexical score (0.3) when vectors exist, falling back to lexical-only. |
| 10 | P3 duplicate code | `getClientIp` ×3, `escapeHtml` ×2 | Extracted `src/lib/request-ip.ts` + `src/lib/escape.ts`; all call sites updated. |
| 11 | P1 spoofed identity | `/api/presence` + `/api/collaboration/typing` accepted a client-claimed `userId` (any user could write presence/typing as anyone) and read them for any chat/project | Both now use the session user and gate reads/writes on `canAccessChat`/`canAccessProject`. |
| 12 | P1 cross-resource read | `/api/collaboration/sessions` + `/api/collaboration/conflict` read/wrote sessions & document ops for arbitrary resource ids with no access check | Both now verify resource access; session participants are server-derived (caller always included). |
| 13 | P1 global maintenance by any user | `POST /api/collaboration/optimize` pruned presences/snapshots/operations across ALL users — callable by any signed-in user | Now global-admin gated; the same cleanup also runs in the daily cron. |
| 14 | P2 console noise | `console.error` in the Clerk webhook + `use-chat`, `console.warn` in AIEngine | Routed through `logger`/`reportError` (error boundaries' `console.error` kept — standard Next.js). |

## C. Feedback system (new)

- **Model** — `Feedback` (userId, category enum, rating 1–5, message ≤10k, page, status NEW/REVIEWED/RESOLVED, reviewedAt, reviewedBy, timestamps) + migration `20260817000000_add_feedback`.
- **API** — `POST /api/feedback` (auth, zod, 5/min rate limit; userId from session only), `GET /api/feedback` (own submissions), `GET /api/admin/feedback` (list + category/status filters, global-admin gated), `PATCH /api/admin/feedback/[id]` (status transitions, records reviewing admin).
- **UI** — "Feedback" button in the authenticated TopBar opens a dialog (category, star rating, message, auto page context); `/admin/feedback` page lists/filters/triages.
- **Email** — submission enqueues an `email` queue job to `FEEDBACK_NOTIFICATION_EMAIL` (no hardcoded address; skipped when unset; delivery via the existing nodemailer SMTP transport).
- **Storage** — text in Postgres; screenshots intentionally NOT stored (no R2 configured); the schema comment documents that any future screenshot must go to R2 with only the object key in Neon.

## D. Remaining risks / manual config

1. **ADMIN_EMAILS + FEEDBACK_NOTIFICATION_EMAIL** must be set in Vercel (add to `.env.local`/Vercel env) and `ADMIN_EMAILS` must contain the operator email(s).
2. **SMTP** — `SMTP_HOST/PORT/USER/PASS/FROM` must be configured for email delivery (feedback notifications, digests, invites). Recommended simplest production option: any SMTP provider (Resend, SendGrid, Postmark) — no code changes needed; `nodemailer` is already wired.
3. **R2 credentials** — `src/lib/storage.ts` is implemented and ownership-safe, but R2 is dormant until `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (and optionally `R2_PUBLIC_URL`) are set in Vercel. Feedback screenshots are intentionally not supported until then.
4. **PDF knowledge ingestion** — `pdf-parse` is installed and the Jest path works under `--experimental-vm-modules` (already in `npm test`); VisionService uses the same static import (the old `eval("require")` path is gone).
5. **Retention windows** — the retention job runs with conservative defaults (operational tables 180–365 days, user content disabled), deletes in 1,000-row id batches, and stops at `RETENTION_MAX_ROWS_PER_RUN` (default 100k) per tick. Review/adjust via `RETENTION_DAYS_<TABLE>` before launch.
6. **`EMBEDDINGS_API_URL/KEY`** — embeddings degrade to hash vectors when unset (documented in audit 13). Set the provider keys to enable real semantic memory + knowledge retrieval.
7. **Clerk production instance** — ensure the publishable/secret keys are the `pk_live_`/`sk_live_` pair and the Paddle client token is live (no `test_`) before launch (`scripts/production-cutover.js` checks this).

## E. Tests executed

| Command | Result |
|---|---|
| `npm run lint` | ✅ 0 errors, 0 warnings |
| `npm run typecheck` | ✅ clean |
| `npm run check:deadcode` | ✅ no dead source files |
| `npm test` (193 unit tests) | ✅ 19 suites / 193 passed |
| `npm run build` | ✅ compiled, 177/177 static pages |
| Playwright chromium | ✅ 16 passed, 9 skipped (need CI secrets) |
| Playwright mobile-android/ios + tablet-ios | ✅ 48 passed, 26 skipped (need CI secrets) |
| `npm run smoke` (build + all projects) | ✅ equivalent run above |

New security tests: `security-guards.test.ts` (cron secret valid/invalid/missing, share DELETE ownership scoping, share GET public, revoked/expired links), `feedback-api.test.ts` (unauthenticated 401, validation, session-scoped userId vs body userId, admin 403/200, status updates, email enqueue on/off), `admin-authz.test.ts` (isGlobalAdmin fail-closed behavior), `webhook-dedupe.test.ts` (new/retry/duplicate claims, processed marking), `retention-service.test.ts` (env windows, disabled user-content tables, terminal-only queue pruning, per-run cap), `collaboration-authz.test.ts` (session-scoped presence/typing, cross-chat denial, admin-gated optimizer).

## F. Env vars

New: `ADMIN_EMAILS`, `FEEDBACK_NOTIFICATION_EMAIL` (documented in `.env.example`). New since round 2: `RETENTION_DAYS_<TABLE>` (optional windows; defaults documented in `RetentionService`). Required for production were already: `DATABASE_URL`, `DIRECT_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `CRON_SECRET`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_PRICE_PRO[_ANNUAL]`, `PADDLE_PRICE_ENTERPRISE[_ANNUAL]`, one AI provider key, `SENTRY_*`, `NEXT_PUBLIC_APP_URL`, and now `SMTP_*` for email.
