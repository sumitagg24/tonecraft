# Production Readiness Audit — 12

Date: 2026-08-02 · Scope: launch-day readiness for ToneCraft. Assumes the app ships on Next.js 16 (Vercel), Neon Postgres, R2 storage, Clerk auth, Paddle billing, Upstash rate limiting, and AI providers (Groq/Google/OpenRouter). Read-only — nothing modified. Cross-references audits 05 (error handling), 06 (security), 09 (DB), 10 (AI), 11 (testing).

**TL;DR:** the app is *feature-complete but not launch-complete*. The blocking items are almost all in security (audit 06), error paths (audit 05), and the absence of any error monitoring/CI/tests (audit 11). Below is the launch checklist, priority-ordered.

---

## P0 — Do not launch without these

| # | Item | Evidence / where | Fix |
|---|---|---|---|
| 0.1 | **Fix message IDOR (C1–C3)** — any authenticated user can edit/delete/continue any message by id; `continue` even exfiltrates victim content | `src/app/api/messages/[messageId]/route.ts`, `continue/route.ts`, `MessageRepository.update/updateFeedback` (audit 06 C1–C3) | Scope all message ops by `chat.userId` (ownership predicate); add regression tests |
| 0.2 | **Unblock Paddle webhook** — `/api/billing/webhook` is behind the auth proxy, so paid subscriptions never activate | `src/proxy.ts` PUBLIC_PATHS vs `billing/webhook/route.ts` (audit 06 H1) | Whitelist `/api/billing/webhook` (Paddle signature check is the auth); verify end-to-end with a test event |
| 0.3 | **Rate-limit every LLM-costly path** — regenerate/continue/tools have no cap; free accounts can burn unlimited provider spend | `checkMessageLimit` only in `chats/[chatId]/messages` (audit 06 H2) | Call `checkMessageLimit` in regenerate/continue/tools; hoist into `AIEngine` if possible; add upload/knowledge caps |
| 0.4 | **Upload validation** — MIME comes from the client (spoofable), no content sniff, no per-day/storage caps enforced, knowledge upload accepts any file | `src/app/api/upload/route.ts`, `knowledge/route.ts` (audit 06 H3/M5) | Magic-byte sniffing, inert-type allowlist, enforce `maxFilesPerDay`/`maxStorageMB` |
| 0.5 | **Error-handling P0s** — `createChat` throws with no catch at 8 call sites (unhandled rejections); ~30 handlers have no try/catch (raw HTML 500s); silent `.catch` loaders show empty states on failure | audit 05 P0-1…P0-6, P3-1 | `withApiHandler` wrapper (audit 08-R4) + catch in hooks + error states in loaders |
| 0.6 | **Error monitoring** — there is none. Client `logger` writes to localStorage (useless in prod); server logs go to console only | `src/lib/logger.ts`; no Sentry/Rollbar | **Sentry** (Gravity-recommended, free tier): `npx @sentry/wizard@latest -i nextjs`, env `SENTRY_DSN` + `SENTRY_AUTH_TOKEN`. Send route errors + client errors + `logger.error` |
| 0.7 | **Security headers + CSP** — none exist | `next.config.ts` (no `headers()`), audit 06 M2 | CSP (self + AI/avatar/R2 hosts), `frame-ancestors 'none'`, Referrer-Policy, HSTS; enable Clerk frame-embedding protection |
| 0.8 | **Env fail-fast + rate-limit fail-closed** — missing Upstash vars silently install a placeholder Redis (no rate limiting); startup-validation only *warns* about LLM keys | `src/lib/ratelimit.ts`, `startup-validation.ts` (audit 06 L4) | Throw at boot in production on missing `DATABASE_URL`/`CLERK_SECRET_KEY`/`UPSTASH_*`/`R2_*`; fail-closed or loud for rate limiting |
| 0.9 | **Backups & DR** — no documented backup/restore process | Neon (PITR), R2 (no lifecycle rules) | Enable Neon PITR + scheduled snapshots; R2 lifecycle rules for uploads/export artifacts; write and *test* a restore runbook |

## P1 — Launch week

| # | Item | Where | Fix |
|---|---|---|---|
| 1.1 | **CI/CD** — none exists; `lint` is the only wired check; `tsc --noEmit` passes today but isn't in CI | `package.json`, no `.github` (audit 11) | GitHub Actions: lint + typecheck + build on every PR; `prisma migrate deploy` + build in the release job; preview deploys |
| 1.2 | **Uptime monitoring** — `/api/health` exists but nothing pings it | `src/app/api/health/route.ts` (also leaks provider error text — audit 06 M3) | **UptimeRobot** (free tier, Gravity alternative) on `/api/health` + a 5xx-rate alert via Sentry; sanitize the health payload |
| 1.3 | **Web analytics** — `/api/analytics` tracks product usage, but there's no marketing analytics on the landing page | `src/app/api/analytics/*` | **Plausible** or **Fathom** (Gravity options; Simple Analytics also viable) — script-tag drop-in, privacy-friendly; keep `/api/analytics` for product metrics |
| 1.4 | **Background jobs** — knowledge indexing and exports run synchronously in request handlers (slow uploads/blocking); `KnowledgeJob`/`ExportJob` tables exist but no worker | `knowledge/route.ts`, `export/route.ts`, schema | Adopt a queue (Upstash QStash or a cron that polls the Job tables) so indexing/exports don't block requests; ship the "indexing…" notification on job completion |
| 1.5 | **Logging** — make server logs structured + request-scoped (requestId), route `logger` through Sentry; keep client logs dev-only | `src/lib/logger.ts` (audit 03 P2-1) | Structured fields; `logger.error` → Sentry; stop localStorage persistence in prod |
| 1.6 | **SEO** — metadata/OG/Twitter/manifest are good; missing `robots.txt` + `sitemap.xml`; `metadataBase` falls back to localhost if `NEXT_PUBLIC_APP_URL` unset; confirm `/public/og.png` exists | `src/app/layout.tsx`, no `robots.ts`/`sitemap.ts` | Add `robots.ts` + `sitemap.ts`; set `NEXT_PUBLIC_APP_URL` in prod; verify OG image |
| 1.7 | **Perf budgets** — landing is lazy-loaded well, but no budget enforcement | audit 03 | Lighthouse CI (LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms) |
| 1.8 | **Rate-limit breadth** — billing checkout/portal and `prompts/import` (creates up to 500 rows) are unthrottled | audit 06 L4 | Add limits |

## P2 — First month

| # | Item | Where | Fix |
|---|---|---|---|
| 2.1 | **DB retention** — `UsageRecord`/`Notification` grow unbounded | audit 09 D2 | Retention job (90d), archive, caps |
| 2.2 | **Start tests** — zero tests today | audit 11 | Phase 1 unit suite (engine/prompts/credits) on day 1; route tests after `withApiHandler` |
| 2.3 | **Provider health dashboard** — `ProviderHealthService` tracks upstreams; expose internally via the existing analytics/admin route | `ProviderHealthService`, `analytics/admin` | Internal status page + alerting |
| 2.4 | **IDOR regression suite** — encode audit-06 C1–C3 as tests | `MessageRepository` | Ownership-scoped tests (audit 11 phase 3) |
| 2.5 | **AI observability** — per-request trace + per-provider error rate | audit 10 A11 | requestId spans; error-rate metric |
| 2.6 | **`poweredByHeader: false`** + harden `GET /api/health` (`force` param) | `next.config.ts`, audit 06 M3 | Disable header; require auth or drop `force` |
| 2.7 | **Share links** — `/share` is account-gated by the proxy; decide and document (token-as-capability vs login wall) | audit 06 L5 | Whitelist `/share` or document |

## Already production-ready (keep)

- **Secrets**: `.env*` fully gitignored; no tracked secrets; only `NEXT_PUBLIC_*` are APP_URL + Clerk keys (public by design); provider keys server-only.
- **XSS posture**: markdown renders without `rehype-raw` (raw HTML escaped); `urlTransform` blocks `javascript:`/`data:`; the only `dangerouslySetInnerHTML` is a static theme script. Keep `rehype-raw` **out** (or pair with DOMPurify).
- **Auth**: Clerk webhook verified via svix; Paddle via SDK unmarshal (once unblocked — 0.2).
- **Env template**: `.env.example` is complete (30+ vars) and the repo is clean (`git ls-files` shows only `.env.example`).
- **SEO foundation**: metadata, OG, Twitter cards, manifest, fonts via `next/font` (no CLS).
- **Perf foundation**: `next/font`, lazy landing sections, tokenized design system.
- **Payment structure**: `PlanService` + `PlanConfig` + credit math (`UsageGuard` with `FOR UPDATE`) is sound.

## The 7-day launch sprint (if it must ship Friday)

1. **Day 1:** 0.1 IDOR fix + 0.2 Paddle webhook + 0.5 `withApiHandler` (auth+try/catch). Wire `tsc --noEmit` + lint into CI.
2. **Day 2:** 0.3 rate limits + 0.4 upload validation.
3. **Day 3:** 0.6 Sentry (wizard) + 0.7 security headers/CSP.
4. **Day 4:** 0.8 env fail-fast + 0.9 backups (Neon PITR on, R2 lifecycle, restore drill).
5. **Day 5:** 1.1 CI build/migrate + 1.2 UptimeRobot + 1.3 analytics script + 1.6 robots/sitemap.
6. **Day 6:** 1.4 move knowledge/export to a queue (or ship the synchronous version with a documented follow-up).
7. **Day 7:** launch checklist sign-off + a smoke run of the critical journeys (audit 11 e2e will eventually automate this).
