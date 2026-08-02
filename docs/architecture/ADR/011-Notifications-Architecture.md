# ADR-011: Notifications Architecture

## Status
Accepted

## Context
ToneCraft needs real-time user notifications for events like generation completion, credit warnings, knowledge indexing status, export readiness, invites, and comments. Users expect immediate feedback without polling overhead.

## Decision
Implement a server-sent events (SSE) notification system with a persistent Postgres-backed event store.

**Components:**
- `Notification` model (id, userId, type, title, body, link, readAt, createdAt)
- `NotificationPreference` model per user (emailEnabled, inAppEnabled, per-event toggles)
- `NotificationService` — core service for create/dedupe/list/read/stream
- SSE endpoint: `/api/notifications/stream` — pushes events in real-time
- Event emitters in message generation, export, knowledge indexing, usage guard paths
- In-app bell + dropdown + full page (`/notifications`) + settings

## Alternatives Considered
1. **Polling** — Simpler but higher latency, more server load.
2. **WebSockets** — Bidirectional not needed; SSE is lighter for server→client only.
3. **Third-party (Pusher, Ably)** — Additional cost/vendor; SSE over HTTP/2 is sufficient.

## Tradeoffs
- **Pro**: Low latency, no extra infrastructure, works over HTTP/2, auto-reconnect via browser EventSource.
- **Con**: Unidirectional (client→server uses regular API); requires sticky sessions if scaled horizontally (mitigated by stateless design with Redis pub/sub in future).

## Consequences
- All event producers call `notificationService.create({ userId, type, title, body, link })`.
- Deduplication window (5 min) prevents notification spam.
- Preferences gate both in-app and email delivery.
- SSE stream is authenticated via Clerk session; each user gets a dedicated stream.

## Evidence
- **Models**: `Notification`, `NotificationPreference` in `prisma/schema.prisma` (lines 311-339)
- **Service**: `src/services/NotificationService.ts`
- **API Routes**: `src/app/api/notifications/route.ts`, `src/app/api/notifications/stream/route.ts`
- **UI**: `src/components/shell/NotificationCenter.tsx`, `src/app/(dashboard)/notifications/page.tsx`, `src/hooks/use-notifications.ts`
- **Event Emitters**: `src/engine/AIEngine.ts` (generation complete), `src/app/api/export/...` (export ready), `src/services/KnowledgeService.ts` (knowledge ready), `src/services/UsageGuard.ts` (credits low)

---

# ADR-012: Offline Mode Architecture

## Status
Planned (Skeleton Implemented)

## Context
Users need to draft and queue messages when network connectivity is lost. The app must cache the shell, persist outbound mutations locally, and sync seamlessly on reconnect.

## Decision
Adopt a Service Worker + IndexedDB outbox pattern with background sync.

**Components:**
- `public/sw.js` — Workbox-generated service worker caching app shell and static assets.
- `src/lib/offline/outbox.ts` — Queue of pending mutations (key: `offline-outbox`) with idempotency keys.
- `src/stores/offline-store.ts` — Zustand store exposing `enqueue`, `flush`, `status`.
- `src/services/OfflineService.ts` — Sync logic: on reconnect, drain outbox via `POST /api/outbox/sync` (idempotent batch).
- `src/components/shared/OfflineIndicator.tsx` — Top-bar pill showing offline/online/syncing state.
- `src/components/shared/SyncBar.tsx` — Progress bar during flush.

**Sync Protocol:**
1. Client detects `navigator.onLine === false` → shows indicator, queues mutations (send message, update draft, etc.) with unique idempotency keys.
2. On `online` event → `OfflineService.flush()` posts batch to `/api/outbox/sync`.
3. Server processes each mutation idempotently (upsert by idempotency key), returns results.
4. Client clears successful entries, retries failures with exponential backoff.

## Alternatives Considered
1. **Background Sync API** — Native but limited browser support; custom outbox is more portable.
2. **Optimistic UI only** — No persistence across tab close; outbox survives reload.
3. **Full PWA with background sync** — Future enhancement; current skeleton is sufficient for MVP.

## Tradeoffs
- **Pro**: Works offline for drafting; no data loss on crash/reload; graceful degradation.
- **Con**: Added client-side complexity; conflict resolution on concurrent edits requires version vectors (deferred to Phase 9).

## Consequences
- All mutating hooks (`useChat`, `useDraft`, `useTools`) must call `offlineStore.enqueue()` when offline.
- `/api/outbox/sync` must be idempotent and handle partial failures.
- Service worker must be updated with each deploy (Workbox `skipWaiting`).

## Evidence
- **Service Worker**: `public/sw.js` (Workbox config in `next.config.js`)
- **Outbox Store**: `src/stores/offline-store.ts`
- **Sync Endpoint**: `src/app/api/outbox/sync/route.ts`, `src/app/api/outbox/status/route.ts`
- **UI**: `src/components/shared/OfflineIndicator.tsx`, `src/components/shared/SyncBar.tsx`
- **Hooks**: `src/hooks/use-offline.ts`, `src/hooks/use-draft.ts` (enqueue on offline)

---

# ADR-013: Export Architecture

## Status
Partial (Sync Formats Implemented; Async PDF/DOCX Planned)

## Context
Users need to export conversations, projects, and messages in multiple formats (Markdown, Plain Text, HTML, PDF, DOCX) for sharing, archival, and external workflows.

## Decision
Support two export paths:
1. **Synchronous client-side formats** (MD, TXT, HTML, Copy) — generated in browser, instant.
2. **Asynchronous server-side formats** (PDF, DOCX) — queued as `ExportJob`, processed by worker, downloadable via signed URL.

**Components:**
- `ExportJob` model (id, userId, chatId?, projectId?, format, status, resultKey, error, createdAt, updatedAt)
- `src/lib/export/serialize.ts` — Client serializers for MD/TXT/HTML/JSON.
- `src/services/DocumentService.ts` — Server-side HTML→PDF/DOCX conversion (using `@vercel/og` or `puppeteer`).
- `POST /api/export` — Accepts `{ scope: 'chat'|'project'|'message', id, format }`, returns job or immediate blob.
- `GET /api/export/[id]` — Job status.
- `GET /api/export/[id]/download` — Signed R2 download URL.
- UI: `ExportMenu.tsx` (message/chat/project), `ExportDialog.tsx` (format picker, progress, download).

## Alternatives Considered
1. **All client-side** — PDF/DOCX generation in browser is heavy, inconsistent across devices.
2. **Third-party API (DocRaptor, CloudConvert)** — Cost per export, latency, vendor lock-in.
3. **Serverless functions with headless Chrome** — Chosen; runs in same infra, no extra cost.

## Tradeoffs
- **Pro**: High-fidelity PDF/DOCX; async doesn't block UI; supports large exports.
- **Con**: Requires job queue, storage for results, cleanup policy (TTL 7 days).

## Consequences
- `ExportJob` rows created for PDF/DOCX; client polls status or uses SSE (future).
- R2 bucket `tonecraft-exports` stores generated files with signed 1-hour URLs.
- Cleanup cron deletes jobs older than 7 days and their R2 objects.

## Evidence
- **Model**: `ExportJob` in `prisma/schema.prisma` (lines 387-403)
- **API Routes**: `src/app/api/export/route.ts`, `src/app/api/export/[id]/route.ts`, `src/app/api/export/[id]/download/route.ts`
- **Serializers**: `src/lib/export/serialize.ts`
- **Document Service**: `src/services/DocumentService.ts` (stub — conversion logic planned)
- **UI**: `src/components/workspace/ExportMenu.tsx`, `src/components/workspace/ExportDialog.tsx`

---

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
1. **PostHog / Mixpanel / Amplitude** — Great for product analytics but adds cost, PII concerns, vendor lock-in.
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

---

# ADR-015: Collaboration Architecture

## Status
Planned (Data Models Only)

## Context
Teams need to share projects, invite members with roles (viewer/editor/admin), comment on messages, and view edit history for compliance and co-authoring.

## Decision
Build collaboration on top of the existing `Project` container using a permission model.

**Components:**
- **Project Membership** — `ProjectMember` model (projectId, userId, role: 'viewer'|'editor'|'admin') already in schema.
- **Invites** — `Invite` model (projectId, email, role, token, expiresAt, acceptedAt) — to be added via migration.
- **Comments** — `Comment` model (id, userId, messageId, content, createdAt, updatedAt) exists; threading via self-referential `parentId` planned.
- **Permissions** — Middleware `requireProjectRole(projectId, ['editor','admin'])` on mutating routes.
- **Sharing** — `ShareLink` model supports read-only links with expiry/revoke.
- **Real-time** — SSE or WebSocket for live presence/cursors (deferred to Phase 10).

## Alternatives Considered
1. **Google Docs-style OT/CRDT** — Overkill; commenting + version history covers 90% of needs.
2. **Third-party (Liveblocks, PartyKit)** — Adds cost; native SSE + Postgres is sufficient for MVP.
3. **Project-level only, no message comments** — Comments are high-value for review workflows; keep.

## Tradeoffs
- **Pro**: Reuses Project container; granular roles; audit trail via comments + version history.
- **Con**: Real-time sync complexity; invite flow needs email delivery (SendGrid/Resend); permission checks on every query.

## Consequences
- New migration adds `Invite` model and `Comment.parentId` for threading.
- API routes: `/api/projects/[id]/invite`, `/api/projects/[id]/members`, `/api/comments/*`.
- UI: `ShareDialog` (upgrade), `CommentThread` component, member management panel.
- All project-scoped queries filter by `ProjectMember` membership.

## Evidence
- **Models**: `ProjectMember` in `prisma/schema.prisma` (lines 219-230), `Comment` (lines 405-416), `ShareLink` (lines 370-385)
- **Services**: `src/services/ProjectService.ts` (has `listMembers`, `addMember` stubs)
- **API Routes**: `src/app/api/projects/[id]/invite/route.ts`, `src/app/api/projects/[id]/members/route.ts` (planned), `src/app/api/comments/route.ts` (planned)
- **UI**: `src/components/shared/CommentThread.tsx` (stub), `src/components/shell/ShareDialog.tsx` (stub)