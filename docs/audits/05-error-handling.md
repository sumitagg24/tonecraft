# 05 — Error Handling & Async Consistency Audit

Scope: every async operation across `src/app/api/**/route.ts` (38 handlers), client hooks (`src/hooks`), pages (`src/app`), and components that fetch. Read-only audit — nothing was changed.

Date: 2026-08-02

## TL;DR

- **P0: 6** — silent failures / unhandled rejections on error paths.
- **P1: 7** — inconsistent, misleading, or missing error UX for the same actions done different ways.
- **P2: 4** — no client timeouts/retry/abort outside streaming; TanStack Query configured but unused.
- **P3: 6** — raw-500 error shape, error-message leaks, dead error-boundary code, minor edge cases.
- **Missing boundaries:** `/library` and `/p/[projectId]` have no `error.tsx`/`loading.tsx`.
- **Dead code:** `use-safe-async.ts`, `use-retry.ts`, `use-tools.ts`, `use-preferences.ts`, `use-premium-toast`, and the class-based `ErrorBoundary.tsx` (the `error.tsx` files wrap `ErrorFallback` directly).

The core problem: ~30 of 38 API handlers have **no try/catch at all**, so any DB/provider/validation throw escapes as an HTML 500. Clients that do `res.json()` on that get a JSON parse error, so the *real* error never surfaces to the user. On the client side, the few operations that do catch often swallow the failure silently (`fetchChats`, `createChat`, persona/library loads, notification prefs) or toast a false success (`ChatMessage.handleFeedback`).

---

## P0 — Silent failures / unhandled rejections

### P0-1 `createChat` throws with no try/catch at any of its 8 call sites
`src/hooks/use-chat.ts:116-124` — throws on `!res.ok` and on network failure, but no caller catches. Any API 500 or offline hit produces an **unhandled promise rejection** and the "New Chat" button appears dead with zero user feedback.

Callers (all unguarded): `src/components/workspace/ConversationSidebar.tsx:75`, `src/components/workspace/CommandPalette.tsx:44`, `src/components/workspace/PromptLibrary.tsx:128`, `src/components/chat/ChatItem.tsx:297`, `src/components/chat/ChatList.tsx:29`, `src/components/topbar/TopBar.tsx:52`, `src/components/navigation/NavigationRail.tsx:36`, `src/components/shell/AppShell.tsx:25`.

Fix: catch in `createChat`, `toast.error("Failed to create chat")` (match the pattern already used by `deleteChat`/`renameChat` at `use-chat.ts:136,151`).

### P0-2 `fetchChats` swallows every failure
`src/hooks/use-chat.ts:126-132` — no try/catch; `!res.ok` is silently ignored; network errors reject unhandled. Called from `chat/[chatId]/page.tsx:32`, `chat/page.tsx:10`, `src/components/workspace/ProjectPage.tsx:36` via `useEffect`. Failure = chat sidebar silently empty, plus an unhandled rejection in the console.

Fix: `try/catch` + `toast.error` or an `error` state on the store, same as `fetchProjects`/`fetchPrompts`.

### P0-3 `ChatMessage.handleFeedback` toasts success even when the API call fails
`src/components/chat/ChatMessage.tsx:51-55` — `setMessageFeedback` (`use-chat.ts:207-214`) toasts `"Failed to save feedback"` on failure, but `handleFeedback` **always** follows with `toast.success("...")`. A failed save shows both an error *and* a success toast.

Fix: have `setMessageFeedback` return a boolean and gate the success toast on it.

### P0-4 `messages/[messageId]` DELETE is broken and unguarded
`src/app/api/messages/[messageId]/route.ts` — the `findById` result is checked at line 42 but **discarded** (deletes via `prisma.message.delete` with the caller's id regardless), has **no ownership check** (any authenticated user can delete any message by id), and no try/catch, so deleting a non-existent message throws → raw 500.

Fix: use the found message's id (or `deleteMany({ id, chat: { userId } })`), and wrap in try/catch.

### P0-5 `billing/webhook` lets the event handler escape unhandled
`src/app/api/billing/webhook/route.ts:23` — `verifyWebhook` is wrapped (line 12) but `handleWebhookEvent` is not; an exception → raw 500 → Stripe retries → potential duplicate sync. Conversely the inner `syncSubscription` failure is caught and swallowed returning `{ received: true }` (line 29-31), meaning a sync failure is acknowledged but never retried or logged as an error.

Fix: wrap `handleWebhookEvent`, return `200 {received:true}` with an error log on any event-processing failure (keep sync idempotent).

### P0-6 Silent `.catch` loaders — failures render as "empty state"
The following load fetches swallow errors and leave the UI showing the empty/loading-off state, indistinguishable from a legitimate empty result:

- `src/components/workspace/KnowledgeLibraryPage.tsx:49` — `.catch(() => setLoading(false))` → "No documents yet" on failure.
- `src/components/workspace/PersonasLibraryPage.tsx:68-77` — `.catch(() => setLoading(false))` → "No personas yet".
- `src/app/(dashboard)/settings/page.tsx:41` — `.catch(() => undefined)` (notif prefs), and `:68` `.catch(() => setPersonaLoading(false))` (personas).
- `src/components/workspace/PersonaPicker.tsx:50`, `KnowledgePicker.tsx:28`, `AIContextPanel.tsx:203` — `.catch(() => undefined)` / `.catch(() => {})`.
- `src/components/shell/NotificationCenter.tsx:44` — `catch { /* ignore */ }`.

Fix: set an `error` state and render a "Failed to load" row/panel instead of an empty state.

---

## P1 — Inconsistent / misleading error UX

### P1-1 Search failures render as "no results"
`src/hooks/use-search.ts:36` sets an `error` state, but `src/app/(dashboard)/search/page.tsx` never reads it — an API failure shows "No results found".

### P1-2 The same action has 3 different error patterns
Message editing/feedback/regeneration are implemented via `use-chat.ts` (throws, caller must catch), via direct `fetch` in `ChatMessage.tsx:61-66` (toast on error), and via `PremiumMessageCard.tsx` (toast on error). Feedback specifically is handled both in `use-chat` (`setMessageFeedback`) and again in `ChatMessage` (P0-3). Consolidate on one hook per action.

### P1-3 Regenerate/continue: success refresh is silently dropped
`src/app/(dashboard)/chat/[chatId]/page.tsx:81-99` — on success the page re-fetches the chat, but a refresh failure is silently ignored (`if (res.ok)`) — stale messages shown with no warning. (Note: `continue` reads `data.continueMessage` at `use-chat.ts:191-195` but the route returns `{ message }` — see P3-4.)

### P1-4 `use-search` aborts on unmount but errors only set state, never surface
`src/hooks/use-search.ts:38` — abort is correct, but combined with P1-1 the error path is invisible. Timeouts/aborts also show no user-facing message.

### P1-5 Loading ≠ error in Picker/Context panels
`PersonaPicker.tsx`, `AIContextPanel.tsx` render "No personas yet" during load (no loading flag at all), so a slow or failed fetch reads as "you have nothing here".

### P1-6 Chat sidebar has no loading state
`fetchChats` (P0-2) never flips a loading flag and `ConversationSidebar`/`ChatList` render nothing while the list is in flight.

### P1-7 `KnowledgeLibraryPage` shows no upload progress feedback on the input
`KnowledgeLibraryPage.tsx` handles upload errors with a toast, but has no in-progress indicator — the chosen file is silently "stuck" while `knowledgeService.create` runs (a slow R2 upload looks frozen).

---

## P2 — No client timeouts / retry / abort

### P2-1 No client-side timeout anywhere
The only timeouts in the repo are server-side (`src/engine/ProviderRouter.ts:60,107` — `AbortSignal.timeout(60000)`, `src/services/ProviderHealthService.ts:97-98`). Every client `fetch` (streaming and regular) can hang indefinitely. The streaming POST in `sendMessage` (`use-chat.ts:37`) will wait forever if the route stalls before first byte.

### P2-2 TanStack Query is configured but unused — retries never apply
`src/components/providers/QueryProvider.tsx` and `src/app/(dashboard)/layout.tsx` mount a `QueryClient` (default retry), but grep shows **zero** `useQuery`/`useMutation` consumers. The retry/refetch machinery is dead weight; all data fetching is hand-rolled. Either adopt it or drop it — the `retry` safety net it implies doesn't exist today.

### P2-3 No retry/backoff on transient failures
`use-retry.ts` and `use-safe-async.ts` exist and implement exactly this, but are **dead code** (no imports anywhere). Client retries for flaky network fetch are unhandled (P0-1/P0-2).

### P2-4 Abort only on streaming and search
Only `sendMessage` (via `stopStreaming`, `use-chat.ts:33-34,112-114`) and `use-search.ts` (abort-on-unmount) use `AbortSignal`. All other fetches (`chat/[chatId]/page.tsx:37`, settings, billing, project pages, pickers) have no abort and can fire state updates after unmount.

---

## P3 — Error shape, leaks, dead code, edge cases

### P3-1 Raw HTML 500s from ~30 handlers
Every handler without try/catch (see matrix) lets exceptions escape as an HTML error page. Clients that call `res.json()` on those paths get `Unexpected token '<'` instead of the real error. Priority for adding catch: `chats` POST/GET, `chats/[chatId]/messages` POST pre-stream, `messages/[messageId]/continue|regenerate` (already wrapped), `knowledge`, `projects`, `prompts`, `search`, `usage`.

### P3-2 Error-message leaks from server to client
Handlers that do catch return the raw exception message: `messages/[messageId]/continue|regenerate` (`error.message`, `src/app/api/messages/[messageId]/continue/route.ts:33`), `knowledge` POST (`error.message`), `chats/[chatId]` PATCH moveChat (`error.message`), `projects/[id]/chats` (`error.message`), `upload` (generic). Internal DB/Upstash/R2 strings can surface in toasts.

### P3-3 `knowledge` POST returns 400 for server errors
`src/app/api/knowledge/route.ts` returns 400 with the leaked message for both validation and server failures — clients can't distinguish "bad input" from "broken". Return 500 for unexpected exceptions.

### P3-4 `continueMessage` reads the wrong field
`use-chat.ts:191-195` returns `res.json()` but the route at `src/app/api/messages/[messageId]/continue/route.ts` returns `{ message }`; the page then accesses `data.continueMessage` at `chat/[chatId]/page.tsx:94` → `undefined`. The "continue" button silently no-ops. (Error-handling-adjacent; flagged here as a silent-failure variant.)

### P3-5 `webhook/clerk` upsert unguarded
`src/app/api/webhook/clerk/route.ts` — `prisma.user.upsert` is not wrapped; a DB failure → 500 → Clerk retries (idempotent, acceptable), but there's no error log.

### P3-6 `share/[token]` DELETE has no auth
`src/app/api/share/[token]/route.ts` DELETE performs a destructive op with no session check. Not strictly an error-handling issue, but it's an unguarded destructive path.

### P3-7 Dead error-handling code
- `src/hooks/use-safe-async.ts`, `src/hooks/use-retry.ts` — no importers.
- `src/hooks/use-tools.ts` — no importers.
- `src/hooks/use-preferences.ts` — no importers (the settings page fetches `/api/preferences` directly and swallows errors).
- `src/hooks/use-premium-toast*` — no importers.
- `src/components/shared/ErrorBoundary.tsx` (class component) — no importers; route `error.tsx` files wrap `ErrorFallback` directly.

---

## Missing / dead error boundaries

| Route | error.tsx | loading.tsx | Notes |
|---|---|---|---|
| `/` | ✔ (`src/app/error.tsx`) | ✔ | |
| `/dashboard/*` | ✔ (`(dashboard)/error.tsx`) | ✔ | |
| `/dashboard/chat` | ✔ | ✔ | |
| `/dashboard/chat/[chatId]` | ✔ | ✔ | |
| `/dashboard/search` | ✔ | ✔ | |
| `/dashboard/settings` | ✔ | ✔ | |
| `/dashboard/tools` | ✔ | ✔ | |
| `/dashboard/billing` | ✔ | ✔ | |
| `/dashboard/library` | ✘ | ✘ | **Missing** — hosts Prompt/Personas/Knowledge libraries |
| `/dashboard/p/[projectId]` | ✘ | ✘ | **Missing** — ProjectPage fetches on its own |
| shared `ErrorBoundary` | n/a | n/a | **Dead** — class component never imported |

`ErrorFallback` (`src/components/shared/ErrorFallback.tsx`) is well-formed (retry/reload/home/error-id). Route-level `error.tsx` files correctly delegate to it; only the class-based `ErrorBoundary.tsx` wrapper is unused.

---

## Appendix — API error-handling matrix

Legend: `try/catch` = handler catches exceptions → JSON error. `res.ok` = client checks response.ok. `toast` = client shows a toast on failure. `silent` = failure swallowed with no user feedback. `none` = nothing.

| Endpoint | Route try/catch | Error shape | Client res.ok | Client feedback |
|---|---|---|---|---|
| `POST /api/billing/checkout` | ✔ | JSON | ✔ (billing page) | ✔ toast |
| `POST /api/billing/portal` | ✘ | raw 500 | — | — |
| `POST /api/billing/webhook` | partial (P0-5) | partial | n/a | n/a |
| `GET/POST /api/chats` | ✘ | raw 500 | GET: ✘ (P0-2) / POST: ✔ (throws, P0-1) | silent / unhandled |
| `GET/PATCH/DELETE /api/chats/[chatId]` | ✘ (PATCH partial) | raw 500 | ✔ (delete/rename/pin/fav/archive toast; GET throws) | toast on mut, GET silent |
| `POST /api/chats/[chatId]/messages` | pre-stream ✘ | raw 500 / SSE error | ✔ | ✔ toast |
| `POST /api/export` | ✘ | raw 500 | ✔ | ✔ toast |
| `GET /api/health` | ✔ | JSON | ✔ | n/a |
| `GET/POST /api/knowledge` | GET ✘ / POST ✔ | raw 500 / leak | ✔ | ✔ toast |
| `GET/PATCH/DELETE /api/knowledge/[id]` | ✘ | raw 500 | ✔ (delete) | ✔ toast |
| `POST /api/knowledge/search` | ✘ | raw 500 | — | — |
| `PATCH/DELETE /api/messages/[messageId]` | ✘ | raw 500 (P0-4) | PATCH ✔ / DELETE — | toast / silent |
| `POST /api/messages/[messageId]/continue` | ✔ | JSON (leak) | ✔ | ✘ broken field (P3-4) |
| `POST /api/messages/[messageId]/regenerate` | ✔ | JSON (leak) | ✔ | ✔ toast |
| `POST /api/messages/[messageId]/feedback` | ✘ | raw 500 | ✔ | ✔ toast (false success, P0-3) |
| `GET/PATCH/DELETE /api/notifications` | ✘ | raw 500 | PATCH ✘ (ignored) | silent |
| `GET/PATCH /api/notifications/preferences` | ✘ | raw 500 | GET ✘ / PATCH ✔ | GET silent (P0-6), PATCH toast |
| `GET/POST/PATCH/DELETE /api/personas*` | ✘ | raw 500 | ✔ | ✔ toast |
| `GET/PATCH /api/preferences` | ✘ | raw 500 | ✘ | silent (dead hook) |
| `GET/POST/PATCH/DELETE /api/projects*` | ✘ (id/chats POST ✔) | raw 500 / leak | ✔ | ✔ toast |
| `GET/POST/PATCH/DELETE /api/prompts*` | ✘ | raw 500 | ✔ | ✔ toast |
| `GET /api/search` | ✘ | raw 500 | ✔ | error state never rendered (P1-1) |
| `POST/GET/DELETE /api/share*` | ✘ | raw 500 | ✔ | ✔ toast |
| `POST /api/tools` | ✘ | raw 500 | ✔ (hook throws) | toast (dead hook) |
| `POST /api/upload` | ✔ | JSON (generic) | ✔ | ✔ toast |
| `GET /api/usage`, `GET /api/usage/stats` | ✘ | raw 500 | ✔ (billing) | ✔ |
| `DELETE /api/user/delete` | ✘ | raw 500 | ✔ | ✔ |
| `POST /api/user/onboarding`, `GET/PATCH /api/user/profile` | ✘ | raw 500 | ✔ | ✔ toast |
| `POST /api/webhook/clerk` | partial (verify) | raw 500 (upsert) | n/a | n/a |

### Counts

- **P0: 6** (P0-1…P0-6)
- **P1: 7** (P1-1…P1-7)
- **P2: 4** (P2-1…P2-4)
- **P3: 7** (P3-1…P3-7)
- Endpoints with **no error handling at all** (no try/catch, no client-side check/feedback): `billing/portal`, `chats` GET, `chats/[chatId]` GET, `knowledge` GET, `knowledge/[id]` GET/PATCH/DELETE, `knowledge/search`, `messages/[messageId]` PATCH/DELETE, `messages/feedback`, `notifications` GET/PATCH/DELETE, `notifications/preferences` GET, `personas` GET/POST/PATCH/DELETE, `preferences` GET/PATCH, `projects` GET/POST/PATCH/DELETE, `prompts` GET/POST/PATCH/DELETE, `prompts/import`, `prompts/render`, `search` GET, `share` POST/GET/DELETE, `tools`, `usage`, `usage/stats`, `user/delete`, `user/onboarding`, `user/profile` GET/PATCH, `webhook/clerk` (partial).
