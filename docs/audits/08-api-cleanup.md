# API Cleanup Audit — 08

Date: 2026-08-02 · Scope: all 46 route handlers under `src/app/api/**/route.ts`, plus the repositories/services they call. Read-only; nothing modified.
Method: read every handler's auth guard, validation, response shape, and error path; cross-referenced with audits 05 (error handling) and 06 (security) to avoid duplication.

Status summary:

- **High: 4** — response-shape inconsistency, error-field type inconsistency, schema duplication, auth boilerplate.
- **Medium: 3** — status-code semantics, manual-vs-zod validation, DTO duplication.
- **Low: 3** — route organization polish, hardcoded placeholders, admin-role verification.

---

## High

### R1. Response envelopes are inconsistent (list endpoints)

Three shapes exist for "return a list":

- **Bare array**: `GET /api/chats` → `chats[]`; `GET /api/search` → `results`; `GET /api/comments` → `comments[]`; `GET /api/drafts` → `drafts[]`; `GET /api/drafts/[id]/versions` → `versions[]`; `GET /api/usage/stats` → `stats`.
- **Wrapped object**: `GET /api/knowledge` → `{ files }`; `GET /api/knowledge/search` → `{ chunks }`; `GET /api/notifications` → `{ notifications, unread }`; `GET /api/projects` → `{ projects, unfiled }`; `GET /api/personas` → `{ personas, defaultPersonaId }`; `GET /api/prompts` → `{ prompts, categories }`.
- **Bare object**: `GET /api/notifications/preferences` → `prefs`; `GET /api/preferences` → `prefs`.

Clients must know per-endpoint whether to read `data` or `data.x`. Fix: pick one convention — a wrapped `{ data }` envelope for everything (or keep bare arrays for pure lists, but then the wrapped ones are the outliers). At minimum, document the convention in the API docs and make every new endpoint follow it.

### R2. `error` field is sometimes a string, sometimes a serialized ZodError

~13 handlers return `NextResponse.json({ error: parsed.error }, { status: 400 })` (chats/[chatId] PATCH, chats/[chatId]/messages POST, messages/[messageId] PATCH, messages/feedback, prompts POST, prompts/[id] PATCH, prompts/import, prompts/render, projects POST, projects/[id] PATCH, personas POST, personas/[id] PATCH, tools, user/profile). `parsed.error` is a `ZodError` — `JSON.stringify` yields `{ issues: [...] }`, so `error` is an **object**, not a string. A client doing `toast.error(data.error)` renders `[object Object]`; anything typed `error: string` is a lie.

Fix: `z.flattenError(parsed.error)` (zod v4) and join the field messages, or return `parsed.error.issues.map(i => i.message).join("; ")`. Keep `{ error: string }` everywhere.

### R3. Zod schemas are duplicated 2–3× per resource

- **Project**: `projectSchema` defined in `projects/route.ts` **and again** in `projects/[id]/route.ts` (also a `schema` in `projects/[id]/chats/route.ts`).
- **Prompt variables**: the `variables: z.array(z.object({ name, defaultValue, description }))` shape is repeated in `prompts/route.ts`, `prompts/[id]/route.ts`, and `prompts/import/route.ts` (3 copies).
- **Persona**: `personaSchema` (`personas/route.ts`) vs `updateSchema` (`personas/[id]/route.ts`) — mostly identical fields.
- **Message**: `messageSchema` (`chats/[chatId]/messages/route.ts`), an inline `schema` (`messages/[messageId]/route.ts` PATCH), and the feedback schema (`messages/[messageId]/feedback/route.ts`).

Fix: a single `src/lib/validators.ts` exporting `projectSchema`, `promptSchema`, `personaSchema`, `messageSchema`, etc., with each route importing the slice it needs. Derive client types from the same schemas (kills DTO drift, cross-ref TS-audit M5).

### R4. Auth guard boilerplate duplicated ~46×, in two dialects

Every handler repeats `const session = await auth(); if (!session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });`. Two dialects coexist:
- `session.user.id` (most routes)
- `session?.user?.id` (prompts/*, share/*, upload)

Fix: a `requireUser()` helper returning `{ user }` or a `401` response, plus a `withApiHandler(handler, { zod })` wrapper that composes auth + zod parse + try/catch (see audit 05 — ~30 handlers have no try/catch at all). This one refactor removes ~150 lines and standardizes the error path.

---

## Medium

### R5. Status-code semantics drift

- `POST /api/knowledge` returns **400** for both validation errors *and* server failures (`route.ts:45` returns 400 with the raw message) — clients can't distinguish bad input from broken (audit 05 P3-3).
- `POST /api/messages/[messageId]/regenerate|continue` return **400** with leaked `error.message` for provider failures (audit 05 P3-2, security M4).
- Elsewhere `{ error: "Not found" }` → 404 and `{ error: "Unauthorized" }` → 401 are consistent — keep that.

Fix: 400 = validation only; 500 + generic message for unexpected errors (log the detail server-side); 403 for authorization failures (vs 401 unauthenticated).

### R6. Manual validation where zod exists (and vice versa)

- Manual string checks instead of zod: `export` (format allowlist), `share` (chatId), `drafts` (chatId), `knowledge` (file presence/size), `notifications` (body parsing), `upload` (MIME/size).
- `user/onboarding` does `JSON.parse` + a hand-rolled shape check ("Invalid input") where a zod schema would be clearer.

These work, but the codebase has two validation philosophies. Prefer zod for anything with a body; keep the allowlist checks (format/MIME) as explicit enums.

### R7. DTO duplication between API and client

`NotificationItem` is redeclared in `use-notifications.ts`, `NotificationCenter.tsx`, and the notifications page. `Chat`/`Message`/`Persona` hand-written shapes in `src/types/index.ts` drift from Prisma payloads (TS-audit M2/M5 — repositories cast `as unknown as` because of it).

Fix: one `src/types/api.ts` per resource derived from `Prisma.XxxGetPayload`/zod `z.infer`, imported by both API and client.

---

## Low

### R8. Route organization & shared helpers

- **No middleware-level auth**: auth is per-route (hence R4). A shared `withApiHandler` also removes the need for per-route auth.
- **Ownership scoping**: most repos have `findByIdAndUser` (chats, projects, prompts, personas, knowledge) — but `MessageRepository.update/updateFeedback` and message DELETE/continue are **unscoped** (security C1–C3). Fold scoping into R4's wrapper.
- **Good reuse to copy**: `NotificationService.create` is called by `export` and `knowledge` routes — the pattern (thin route → service) is right; extend it to validation.

### R9. Hardcoded placeholders

- `src/app/api/outbox/sync/route.ts:30` returns `{ pending: 0, lastSync: ... }` with a hardcoded `0` — dead/placeholder response. Either implement or delete the endpoint.
- `analytics/admin` determines admin via an in-route check — confirm the source (env role list vs DB field) and document it; the 403 branch should be covered by a test once tests exist.

### R10. Response-shape gems to standardize on

- Mutations return **three different success shapes**: `{ success: true }` (chats, messages, notifications, user), `{ ok: true }` (prompts/[id], drafts), and the created entity (`chats` POST → chat, `personas` POST → persona, `share` POST → `{ url, token, expiresAt }`, `import` → `{ imported }`, `render` → `{ rendered }`). Pick one: return the created entity on 201, and `{ ok: true }` for no-payload mutations.
- Webhooks (`webhook/clerk`, `billing/webhook`) both return `{ received: true }` — consistent, keep.
- `GET /api/health` returns a provider report object — it's a special endpoint, document it as such.

---

## Endpoint inventory notes

- **No duplicated endpoints found** — list vs single-item routes are distinct everywhere; `personas/curated` is a clean read-only companion.
- **No middleware duplication** exists because no shared middleware exists (that's the problem — see R4/R8).
- 46 handlers, ~30 without try/catch (audit 05 P3-1) — the single highest-value refactor is the `withApiHandler` wrapper, which fixes R4 + audit-05 P3-1 in one pass.

## Recommended cleanup order

1. `withApiHandler` (auth + zod + try/catch + generic 500) — kills R4, R5, audit-05 P3-1/P3-3, and gives a single error shape.
2. `z.flattenError` for all zod-400 responses (R2).
3. `src/lib/validators.ts` + `src/types/api.ts` (R3, R7).
4. Response-envelope convention + mutation success shape (R1, R10).
5. Delete/implement the outbox placeholder (R9).
