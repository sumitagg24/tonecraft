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
<!-- END:anchored-summary -->
