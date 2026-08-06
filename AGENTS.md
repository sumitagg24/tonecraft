<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:anchored-summary -->
## Anchored Summary

### Phase 5D — Final Product Polish & Production Readiness
- Dead code removal (10+ files), import cleanup (40+ unused imports), fixed 3 TS errors, replaced fake testimonials, section variants, skip-to-content a11y, 3D tilt/mouse spotlight hooks.

### Phase 5.5 — Application Stability, Error Handling & Loading Architecture

**Created:**
1. **Centralized logging utility** (`src/lib/logger.ts`) — `debug`/`info`/`warn`/`error` levels, dev-only debug, ready for Sentry/etc swap-in
2. **Error boundary system** — `ErrorBoundary` (class-based reusable component), `ErrorFallback` (friendly UI with retry/reload/home/error ID/dev details)
3. **Unified loading system** — `PageSkeleton`, `CardSkeleton`, `ListSkeleton`, `DashboardSkeleton` (`src/components/shared/PageSkeleton.tsx`)
4. **Suspense boundaries** — `SuspensePage`, `SuspenseSection`, `SuspenseDefault` wrappers (`src/components/shared/SuspenseBoundary.tsx`)
5. **Safe async hook** (`src/hooks/use-safe-async.ts`) — unmount guard, abort controller, refetch
6. **Retry system** (`src/hooks/use-retry.ts`) — exponential backoff, max retries, offline detection
7. **Route error/loading/not-found files** for every route group (root, dashboard, chat, chat/[chatId], settings, billing, search, tools)

**Fixed:**
8. **API error handling in hooks** — `use-chat.ts`: all 12 functions now check `res.ok` and show toast on failure; `use-search.ts`: abort controller, error state, no silent catch; `use-preferences.ts`: optimistic rollback on failure, toast errors; `billing/page.tsx`: error handling on subscribe + usage fetch
9. **Next.js `ssr: false` build warning** — extracted 16 dynamic imports to `DynamicLandingSections` client component

**Zero TypeScript errors (pre-existing verified clean).**

### Phase 5.6 — .gitignore Security Audit & .env Hygiene
- **Expanded .gitignore** — 15 new patterns (IDE, OS, DB, uploads, cache, build artifacts, temp files)
- **Fixed env ignore** — `.env*` → explicit list + `!.env.example` to keep the template committed
- **Created `.env.example`** — all 30+ required variables with empty placeholders
- **Secret scan** — zero secrets committed; `process.env` used everywhere; repo is clean
- **Single commit from Create Next App** — all application code is untracked, safe to commit

### Phase 5.7 — Enterprise Audit Logging & Admin Dashboard
**Created:**
1. **AuditLogRepository** + **AuditLogService** — typed `AuditAction` union, `record()`/`list()`/`aggregateByAction()`/`aggregateByResource()`
2. **Audit API** — `/api/audit/logs` (GET with filters, POST record), `/api/audit/stream` (SSE)
3. **Admin API** — `/api/admin/metrics/overview`, `/api/admin/metrics/storage`, `/api/admin/metrics/credits`, `/api/admin/metrics/projects`, `/api/admin/metrics/members`, `/api/admin/metrics/knowledge`, `/api/admin/metrics/ai-usage` (all workspace-admin gated)
4. **Admin API** — `/api/admin/permissions` (GET members/invites/audit, PATCH role change, DELETE member)
5. **Admin API** — `/api/admin/audit-logs` (workspace-scoped audit log listing)
6. **Admin Dashboard UI** — `(dashboard)/admin/layout.tsx` with sub-nav, overview/storage/credits/projects/members/knowledge/usage/charts pages, permissions page, audit log page

**Modified:**
7. **NotificationService** — `create()` with `NotificationPayload`, `createMention()`, `createComment()`, `createInvitation()`, `digest()`, `savePushSubscription()`
8. **Comments API** — mention parsing (`@email` or `@userId`), comment notifications to message owners
9. **Workspace invites** — `notificationService.createInvitation()` call added
10. **Notification SSE stream** — sends `notifications` events (10s polling for last 30s) plus `unread_count`
11. **`use-notifications` hook** — handles notification SSE events, dedup, visibility reconnect, backoff
12. **Settings page** — expanded notification prefs (channel toggles, daily digest, category toggles)
13. **Nav** — Admin item added to `NAV_ITEMS`
14. **Prompts API** — wired `auditLogService.record("prompt.create", ...)`
15. **Schema** — `AuditLog`, `PushSubscription`, `NotificationType`/`NotificationChannel` enums added; added `workspaceId`/`projectId` scalar fields to `UsageRecord` for workspace-scoped metrics
16. **KnowledgeService** — implemented `create`/`list`/`findByIdAndUser`/`rename`/`remove`/`retrieve`/`linkToMessage` (replaced broken embedding stub + dead `searchPromptsWithEmbeddings`/`searchKnowledgeWithEmbeddings` that depended on missing `@/lib/embeddings`); exported `knowledgeService` instance

**Verification:** Phase 5.7 new/changed files — `npx tsc --noEmit --skipLibCheck` **zero errors**; `npx prisma generate` succeeds. NOTE: 290 pre-existing scaffold errors remain in tracked files outside this phase's scope (e.g. `PromptRepository`, `UsageService`, `workspace-store`, `CollaborationProvider`, `ProjectMemberList`) — present in the working tree before this work, not introduced here.

### Phase 5.8 — Full Type-Safety Sweep (`npm run build` green)
Cleared the remaining ~290 pre-existing scaffold type errors so `npm run build` passes end-to-end (`npx tsc` = 0 errors, `next build` ✓). Highlights:
- **Stale `tsconfig.tsbuildinfo`** (from `incremental: true`) was hiding ~236 errors from subsequent tsc runs — verify with `--incremental false` or after deleting the buildinfo.
- **Prisma**: added `WorkspaceInvite.token String? @unique` (invite flow was token-based but column was missing) — **requires `npx prisma db push`/migration to apply**; regenerated client; fixed compound-unique `where` with `null` (Presence upserts → `findFirst`+create/update) and `select`+`include` conflicts; JSON payloads cast to `Prisma.InputJsonValue`.
- **PromptRepository** rewritten: missing `prisma` import + `PromptVariable` export restored, `findUnique`/`update`/`delete` non-unique `where` → `findFirst`/`updateMany`/`deleteMany`, compound-key wrappers (`collectionId_promptId`), `sharedWithId`, `deleteVersion` added.
- **UsageService** rewritten against the real `UsageRecord` schema (provider/model/tokens/latency…) + `getStats`; VersionHistoryService computes `version`/`sizeBytes` and re-exports `VersionSnapshot`.
- **Routes**: fixed `ctx.body`→handler `body`, `ctx.query`→`nextUrl.searchParams`, missing schemas/imports; deleted dead `prompts/api-routes.ts`; rewrote `prompt-versions` route (query-param based).
- **Hooks**: `use-activity`/`use-version-history` rewritten without `@tanstack/react-query` (was uninstalled, no provider); `use-socket` event map extended + reconnection option names fixed + stored handlers replayed on connect.
- **Deps**: installed `nodemailer` (+ `@types/nodemailer`); replaced `date-fns` usage with `timeAgo` helper in `lib/utils`.
- **Components**: fixed missing imports (`Button`, `Avatar`, lucide icons, `next/link` default import), invalid button variants/sizes, `_count` reference, socket/event typing in collaboration + workspace components.
<!-- END:anchored-summary -->
