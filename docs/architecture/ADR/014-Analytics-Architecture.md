# ADR-014: Analytics Architecture

## Status
Partial (Event Logging Implemented; Dashboards Planned)

## Context
Product and engineering need visibility into usage patterns, model performance, credit consumption, errors, and revenue to iterate on pricing, routing, and UX.

## Decision
Implement a lightweight analytics pipeline:
1. **Event logging** — `AnalyticsService.trackEvent(userId, event, properties)` writes structured logs via `logger.info`.
2. **Usage records** — `AIEngine.trackUsage` already writes per-generation `UsageRecord` (provider, model, tokens, latency, success).
3. **Aggregation** — Periodic cron jobs compute rollups (daily/weekly/monthly) into materialized views or summary tables.
4. **Dashboards** — `/account/usage` (user-facing) and `/admin/analytics` (admin-only) consume aggregated data.

**Events Tracked:**
- `generation.complete` (model, tokens, latency, intent)
- `generation.error` (model, error, intent)
- `export.complete` / `export.error`
- `knowledge.indexed` / `knowledge.failed`
- `credits.low` / `credits.exhausted`
- `subscription.created` / `subscription.updated` / `subscription.cancelled`
- `invite.sent` / `invite.accepted`

## Alternatives Considered
1. **PostHog/Mixpanel/Amplitude** — Great for product analytics but adds cost, PII concerns, vendor lock-in.
2. **Full data warehouse (BigQuery, Snowflake)** — Overkill for current scale; Postgres + cron is sufficient.
3. **Client-side only** — Misses server-side events (webhooks, background jobs).

## Tradeoffs
- **Pro**: Zero external cost, full data ownership, schema flexibility, GDPR-compliant by design.
- **Con**: Manual dashboard building; aggregation queries must be maintained; no built-in funnel/cohort analysis.

## Consequences
- All services emit via `analyticsService.trackEvent()`.
- Admin dashboard guarded by `role: 'admin'` check (Clerk org metadata or custom claim).
- Retention: raw events 90 days, aggregated rollups indefinitely.

## Evidence
- **Service**: `src/services/AnalyticsService.ts`
- **Usage Tracking**: `src/engine/AIEngine.ts` lines 253-293 (`trackUsage`)
- **API Routes**: `src/app/api/analytics/me/route.ts`, `src/app/api/analytics/admin/*/route.ts`
- **Dashboard UI**: `src/app/(dashboard)/account/usage/page.tsx`, `src/app/(dashboard)/admin/analytics/page.tsx` (stubs)
- **Models**: `UsageRecord`, `Usage`, `Subscription` in `prisma/schema.prisma`