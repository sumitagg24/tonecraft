# Launch Checklist — v1.0.0-beta

> Derived from `docs/audits/12-production-readiness.md` (P0/P1/P2) and the readiness report.
> "Must" items are launch-blocking. Each item lists the owner area and the verification.

---

## Must complete before public launch

| # | Item | Area | Verify by |
|---|---|---|---|
| 1 | **Enable real rate limiting in prod** — set `UPSTASH_REDIS_REST_URL`/`TOKEN` (currently fails closed, which blocks the product) | Infra | `checkMessageLimit` returns real counters |
| 2 | **Paddle webhook e2e test** — send a Paddle test `subscription.updated` event, confirm `Subscription` flips to active and `PlanService` cache invalidates | Billing | Test event → `/api/billing/webhook` → DB row |
| 3 | **Activate Sentry** — set `SENTRY_DSN` (+ optional wizard SDK swap); confirm a forced `logger.error` arrives | Monitoring | Error visible in Sentry project |
| 4 | **CI/CD** — GitHub Actions: lint + `tsc --noEmit` + `next build` on PR; `prisma migrate deploy` + build in release job | Infra | PR gates green; deploy succeeds |
| 5 | **IDOR regression tests** — encode audit-06 C1–C3 (foreign message edit/delete/continue) as route tests | Testing | Tests fail on the pre-8.17 code |
| 6 | **Prod env validation** — every var in `.env.example` set (DB, Clerk, Upstash, R2, Paddle, providers); boot passes fail-fast | Infra | `next start` boots without the startup error |
| 7 | **Backups enabled** — Neon PITR on; R2 lifecycle rule `retain-deleted-30d` created; restore drill run once | Infra | Runbook `docs/runbooks/backup-restore.md` followed |
| 8 | **Security headers verified in prod** — CSP present, `frame-ancestors 'none'`, HSTS; no console/CSP violations on the landing + chat + checkout journeys | Security | Browser console clean on prod URL |
| 9 | **Smoke journeys** — login → send + stream a chat → regenerate → tools → knowledge upload + grounded answer → search → export → share link → checkout (test mode) → notification bell | QA | All green on staging or prod |
| 10 | **Uptime monitor** — UptimeRobot (or equivalent) pinging `/api/health`; 5xx alert wired to Sentry | Monitoring | Alert fires on a forced 503 |

## Should complete before launch

| # | Item | Area | Notes |
|---|---|---|---|
| 11 | Staging environment with near-prod parity | Infra | Same provider mix, seeded data |
| 12 | Marketing analytics (Plausible/Fathom) on landing | Marketing | Script-tag drop-in; keep `/api/analytics` for product metrics |
| 13 | Structured request logging (requestId) | Monitoring | audit 12 P1.5 |
| 14 | Lighthouse budgets: LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms | Perf | Wire into CI after tests exist |
| 15 | Accessibility check in CI (axe-core) + close audit-04 leftovers | A11y | WCAG AA smoke |
| 16 | PDF export decision — ship a real PDF pipeline or visibly gate HTML print | Export | Product decision |
| 17 | Share-link policy — whitelist `/share` (token-as-capability) or keep account-gated; document | Security | audit 12 P2.7 |
| 18 | Move knowledge indexing + exports to a queue (QStash) or accept synchronous + document | Infra | audit 12 P1.4 |
| 19 | `NEXT_PUBLIC_APP_URL` set in prod; verify OG image + `robots.txt`/`sitemap.xml` fetch | SEO | Done at build — verify live |
| 20 | Dependency vulnerability scan (`npm audit` / Dependabot) | Security | Zero high-severity findings |

## Can wait until after launch

| # | Item | Area | Notes |
|---|---|---|---|
| 21 | pgvector + embeddings migration | Knowledge | `pgvector_embeddings_pending.sql` prepared |
| 22 | Retention job execution (UsageRecord 90d, read notifications 90d) | DB | SQL ready, needs scheduler |
| 23 | Internal provider-health dashboard | AI | `ProviderHealthService` data exists |
| 24 | Offline PWA (service worker, offline chat cache) | Offline | Partial today |
| 25 | Team workspace / orgs / RBAC | Collaboration | Feature flags exist, not built |
| 26 | AI observability traces + error-rate metrics | AI | audit 10 A11 |
| 27 | Search relevance (ranking/facets) | Search | ILIKE sufficient at launch scale |
| 28 | Per-day upload buckets | Uploads | Cumulative caps are conservative |
| 29 | Batch export of projects | Export | Nice-to-have |
| 30 | Dead-code cleanup from audit 01 | DX | Safe anytime post-freeze |

---

## Launch gate definition

**GO** when items 1–10 are complete **and** the readiness report shows Testing ≥ 5/10,
Monitoring ≥ 6/10. Everything else ships as follow-ups.
