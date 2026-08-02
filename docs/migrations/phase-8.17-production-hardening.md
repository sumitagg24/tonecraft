# Phase 8.17 — Production Hardening

Implements the P0 checklist from `docs/audits/12-production-readiness.md` plus selected P1/P2 items. Verified: `tsc --noEmit` clean, `eslint --max-warnings=0` clean, `next build` passes (`/robots.txt`, `/sitemap.xml` generated).

## P0 — implemented

| Audit | Item | Change |
|---|---|---|
| 0.1 | **Message IDOR** | `MessageRepository`: added ownership-scoped `findByIdAndUser`, `updateForUser`, `updateFeedbackForUser`, `deleteForUser` (all filter by `chat.userId`). `PATCH`/`DELETE /api/messages/[messageId]` and `POST .../feedback` now use them (404 on foreign messages). `MessageService.continueMessage` now loads via `findByIdAndUser` — closes the content-exfiltration vector. Deleted dead unscoped `MessageService.editMessage/deleteMessage/setFeedback` + dead `MessageRepository.update/updateFeedback` (IDOR traps). |
| 0.2 | **Paddle webhook unblocked** | `/api/billing/webhook` whitelisted in `src/proxy.ts` (Paddle signature verification is the auth). Subscriptions can now activate. |
| 0.3 | **Rate-limit every LLM-costly path** | `checkMessageLimit` added to regenerate, continue, tools, prompts/import, billing checkout + portal. All share the same user-scoped sliding-window counters as `/chats/[chatId]/messages`. |
| 0.4 | **Upload validation** | New `src/lib/file-validation.ts`: extension allowlist + magic-byte sniffing (jpeg/png/gif/webp/pdf/mp3/wav) + NUL-free text check; exact-subtype match for binary families (alias-normalized). `/api/upload` and `/api/knowledge` reject mismatches (415), enforce plan `maxFileSize`, `maxFilesPerDay`, `maxStorageMB`, and count uploads against usage. Size caps are enforced **before** reading the body (no memory-DoS). Knowledge uses a narrower document allowlist (pdf/txt/md/html/json/xml/csv). |
| 0.5 | Error handling | Already landed in Phase 8.12 (`withApiHandler`). |
| 0.6 | **Error monitoring** | New `src/lib/error-reporting.ts` — dependency-free Sentry envelope client (activates on `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, no-op otherwise). `logger.error` routes errors through `reportError`; `withApiHandler` catch path benefits automatically. |
| 0.7 | **Security headers + CSP** | `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS, `Permissions-Policy`, production-only CSP (`frame-ancestors 'none'`, Clerk/AI/R2 hosts, `object-src 'none'`). `poweredByHeader: false`. |
| 0.8 | **Env fail-fast + fail-closed rate limit** | `startup-validation.ts` throws at production runtime (server-only, build-aware via `NEXT_PHASE` guard — never breaks `next build` or the client bundle) on missing DB/Clerk/Upstash/R2 vars. `ratelimit.ts` fails **closed** in production when Upstash is unconfigured (loud once), permissive in dev. |
| 0.9 | **Backups & DR** | `docs/runbooks/backup-restore.md` — Neon PITR + weekly branch snapshots, R2 lifecycle retention, restore procedures, quarterly drill, incident checklist. |

## P1/P2 — included (low-risk wins)

| Audit | Item | Change |
|---|---|---|
| 1.2 | **Health payload sanitized** | `/api/health` no longer exposes provider error text; `force` param removed. |
| 1.6 | **SEO** | `src/app/robots.ts` + `src/app/sitemap.ts` (public pages + blog); account/API paths disallowed. |
| 2.6 | **`poweredByHeader: false`** | Done in `next.config.ts`. |

## Deferred (documented, out of scope or needs credentials)

- **0.6 full Sentry install**: abstraction + env contract ready; run `npx @sentry/wizard@latest -i nextjs` and set `SENTRY_DSN` when ready (SDK swap touches only `sendError`).
- **1.1 CI/CD, 1.4 job queue (QStash), 1.5 requestId logging, 1.7 Lighthouse CI, 2.x**: see audit 11/12 for follow-ups.
- Note: `filesUploaded`/`storageUsed` caps are cumulative (Usage has no per-day bucket for files); conservative daily-style limits applied — a true daily bucket is a 2.x follow-up.

## Files touched

- New: `src/lib/file-validation.ts`, `src/lib/error-reporting.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`, `docs/runbooks/backup-restore.md`
- Modified: `next.config.ts`, `src/proxy.ts`, `src/lib/logger.ts`, `src/lib/ratelimit.ts`, `src/lib/startup-validation.ts`, `src/repositories/MessageRepository.ts`, `src/services/MessageService.ts`, `src/app/api/upload/route.ts`, `src/app/api/knowledge/route.ts`, `src/app/api/health/route.ts`, `src/app/api/messages/[messageId]/route.ts`, `src/app/api/messages/[messageId]/feedback/route.ts`, `src/app/api/messages/[messageId]/continue/route.ts`, `src/app/api/messages/[messageId]/regenerate/route.ts`, `src/app/api/tools/route.ts`, `src/app/api/prompts/import/route.ts`, `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/portal/route.ts`
