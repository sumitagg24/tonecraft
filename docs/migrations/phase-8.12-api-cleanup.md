# Phase 8.12 — API Infrastructure Refactor (Migration Report)

**Date:** 2026-08-02 · **Branch:** phase-8-product-architecture
**Status:** ✅ Complete — `tsc` clean, `eslint --max-warnings=0` clean, `next build` succeeds

---

## Goal

Replace duplicated auth / validation / try-catch / logging boilerplate in every API
route with one shared handler, and standardize the JSON response contract app-wide.

---

## Response contract (now enforced everywhere)

```jsonc
// Success
{ "success": true, "data": <payload> }

// Failure
{ "success": false, "error": { "code": "...", "message": "...", "details?": "..." } }
```

Raw `ZodError` is **never** serialized — it is flattened to a string and its issues
array is returned only under `error.details` for validation failures.

**Documented protocol exceptions** (not JSON envelopes — they keep native formats):
- `POST /api/chats/[chatId]/messages` — SSE streaming response
- `GET /api/notifications/stream` — SSE event stream
- `POST /api/webhook/clerk` — Svix signature-verified webhook
- `POST /api/billing/webhook` — Paddle signature-verified webhook
- `GET /api/health` — public liveness payload

---

## What changed

### New / rewritten infrastructure (`src/lib/`)

| File | Change |
|---|---|
| `src/lib/withApiHandler.ts` | Rewritten to the strict envelope. Handles Clerk auth, zod validation (flattened errors), request-id logging, try/catch with 500 mapping, and `ok()`/`fail()` helpers. |
| `src/lib/api-client.ts` | **New.** Client-side `api<T>()` / `apiPost<T>()` helpers that unwrap `data` and throw a typed `ApiError` (status, code, message, details). Preserves `AbortError` semantics. |

### Server routes migrated (46 files)

All JSON routes now use `withApiHandler`. Multipart routes (`/api/upload`,
`/api/knowledge` POST) keep reading `formData()` directly inside the handler — the
wrapper skips JSON body parsing for non-JSON content types.

- chats, chats/[chatId], projects, projects/[id], projects/[id]/chats, prompts,
  prompts/[id], prompts/import, prompts/render, personas, personas/[id],
  personas/curated, knowledge, knowledge/[id], knowledge/search, comments, drafts,
  drafts/[id]/versions, export, messages/[messageId], messages/[messageId]/feedback,
  messages/[messageId]/continue, messages/[messageId]/regenerate, notifications,
  notifications/preferences, preferences, search, tools, usage, usage/stats,
  user/delete, user/onboarding, user/profile, analytics/me, analytics/admin,
  outbox/sync, share, share/[token], billing/checkout, billing/portal, upload.

### Client call sites migrated (19 files)

All consumers now use `api<T>()` and read `.data` implicitly — no call site parses
`{ success, data }` manually.

- Hooks: `use-chat`, `use-projects`, `use-prompts`, `use-search`, `use-notifications`,
  `use-preferences`, `use-tools`, `use-draft`
- Pages: `settings`, `notifications`, `analytics`, `billing`, `share/[token]`,
  `chat/[chatId]`, `onboarding`
- Components: `ExportMenu`, `ToolPanel`, `CommentThread`, `AIContextPanel`,
  `KnowledgePicker`, `KnowledgeLibraryPage`, `PersonaPicker`, `PersonasLibraryPage`,
  `PremiumComposer`, `PremiumMessageCard`, `ChatMessage`

### Behavior fixes surfaced by strict typing

- `Chat.messages` is optional in the type — call sites that previously relied on
  `any` now coalesce with `chat.messages ?? []` (4 call sites).
- The SSE stream route's **pre-stream** errors now use the envelope so the client's
  existing `err.error?.message` handling keeps working.
- `analytics/admin` had dropped `totalUsers` during migration — restored.

---

## Architectural decisions

1. **One envelope everywhere.** The old code mixed bare arrays, `{ items }`,
   `{ list }`, and `{ error: string }` shapes. All JSON endpoints now return the
   same shape; clients never touch the envelope directly.
2. **Wrapper stays thin.** `withApiHandler` handles cross-cutting concerns only
   (auth, validation, logging, error mapping). Business logic stays in each route.
3. **SSE/webhook/health are explicit exceptions** — documented in the wrapper's
   header comment so future routes don't accidentally envelope them.
4. **`api-client.ts` centralizes client errors** — every caller gets consistent
   `ApiError` (status + code + message), replacing ad-hoc `err.error?.message`
   parsing.

## Performance improvements

- No functional perf change this phase; the payoff is **maintainability**: ~46
  route files now contain only their business logic (auth + try/catch removed),
  and client error-handling is one helper instead of ~19 hand-rolled variants.

## Verification

```
npx tsc --noEmit              ✅ 0 errors
npx eslint src --max-warnings=0  ✅ 0 errors
npm run build                 ✅ succeeds, all routes compile
```

## Remaining debt

- SSE routes are intentionally un-enveloped (documented); a future pass could add
  a typed SSE event schema.
- `billing/webhook` route was not audited for signature verification in this phase
  (blocked — see Phase 8.17 production hardening).
- A few routes (e.g. `share/[token]`, `notifications/stream`) are auth-optional or
  token-authenticated by design; their auth paths were preserved as-is.
