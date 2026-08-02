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
3. Server processes each mutation idempotically (upsert by idempotency key), returns results.
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