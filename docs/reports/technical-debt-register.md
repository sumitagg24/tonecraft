# Technical Debt Register

> Snapshot at `v1.0.0-beta` (2026-08-02). Priority: P0 = launch-blocking, P1 = within 1–2 months,
> P2 = opportunistic. Effort: S ≤ 1d, M ≤ 3d, L ≤ 1w, XL > 1w. Risk: impact if the debt stays.
> Recommended release: which version milestone should carry the fix.

| # | Item | Source | Priority | Effort | Risk if deferred | Recommended release |
|---|---|---|---|---|---|---|
| T01 | Zero automated tests (engine, prompts, credits, routes, a11y) | audit 11 | P0 | XL | Regressions ship silently; launch gate can't be trusted | 1.0.0 |
| T02 | No CI/CD (lint only; no tsc/build/migrate in CI) | audit 12 P1.1 | P0 | M | Broken builds/deploys land on main; no release discipline | 1.0.0 |
| T03 | Sentry abstraction inactive (no DSN, no SDK swap) | audit 12 P0.6 | P0 | S | Blind in production; errors invisible to the team | 1.0.0 |
| T04 | Upstash unconfigured in prod → rate limiting fails closed (product blocked) | audit 12 P0.8 | P0 | S | Free-tier spend abuse / product unavailable | 1.0.0 |
| T05 | Paddle webhook never exercised end-to-end with a test event | audit 12 P0.2 | P0 | M | Subscriptions silently never activate (was blocked pre-8.17) | 1.0.0 |
| T06 | Knowledge indexing + exports run synchronously in request handlers | audit 12 P1.4 | P1 | L | Slow uploads/blocking requests; poor UX at scale | 1.1 |
| T07 | No retention job (UsageRecord/Notification growth unbounded) | audit 09 D2 | P1 | M | Unbounded table growth → cost + slow queries | 1.1 |
| T08 | Upload counters cumulative, not daily buckets | audit 12 P0.4 note | P1 | M | Conservative caps wrong after a busy day; under-counts | 1.1 |
| T09 | No uptime/health monitoring pinging `/api/health` | audit 12 P1.2 | P1 | S | Outage unnoticed | 1.0.0/1.1 |
| T10 | No structured request-scoped logging (requestId) | audit 12 P1.5 | P1 | M | Can't trace a failing request end-to-end | 1.1 |
| T11 | Share-link policy undecided (`/share` account-gated) | audit 12 P2.7 | P1 | S | Feature either broken for its purpose or leaks | 1.0.0 |
| T12 | Dead code from Phase 7: ChatList, ChatInput, ContextPanel, unused hooks | audit 01 | P2 | M | Confusion + bundle weight; low runtime risk | 1.1 |
| T13 | pgvector disabled — knowledge retrieval scans text chunks | audit 09 D1 | P2 | L | Slow retrieval at scale; no semantic search | 1.1/2.0 |
| T14 | No AI observability (per-request traces, provider error rates) | audit 10 A11 | P2 | L | Can't tune providers; provider incidents invisible | 1.1 |
| T15 | Legacy unscoped MessageService/Repository methods removed but edit/delete/feedback rely on routes only | 8.17 | P2 | S | — (resolved); keep routes as the only path | — |
| T16 | `ANTHROPIC_API_KEY` accepted but no client; provider name removed from routing | 8.15 | P2 | M | Misleading config; users with only Anthropic key get no provider | 1.1 |
| T17 | Offline support partial (no service worker / PWA) | audit 12 P2.x | P2 | XL | No offline value beyond drafts; marketing overpromise | 2.0 |
| T18 | Search is ILIKE-only (no ranking/facets) | product/Search | P2 | M | Poor results on large corpora | 2.0 |
| T19 | No dependency vulnerability scanning in CI | audit 06 | P1 | S | Known-CVE packages ship | 1.0.0 |
| T20 | Perf budgets not enforced (no Lighthouse CI) | audit 12 P1.7 | P2 | M | Silent perf regressions | 1.1 |
| T21 | Mobile has no real-device QA or iOS safe-area audit | audit 04/12 | P2 | M | Rendered-content cutoffs on iOS Safari | 1.1 |
| T22 | Migrations not auto-run in CI/deploys | audit 12 P1.1 | P1 | S | Schema drift between envs | 1.0.0 |
| T23 | `docs/research/ai-providers-research-part2.md` is a large raw dump — needs a curated summary | 8.12 research | P2 | S | Hard to consume | 1.1 |

---

## Top 5 to schedule first

1. **T01** (tests) — unblocks everything; audit 11 Milestone 1 is the plan.
2. **T02** (CI) — pairs with T01; gate on PRs.
3. **T03 + T09** (Sentry + uptime) — one afternoon, removes the blind spot.
4. **T05** (Paddle e2e) — validates the revenue loop.
5. **T07** (retention job) — SQL already written; add a scheduler.
