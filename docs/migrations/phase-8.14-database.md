# Phase 8.14 — Database Optimization (Migration Report)

**Date:** 2026-08-02 · **Branch:** phase-8-product-architecture
**Status:** ✅ Complete — `prisma validate` clean, `prisma format` applied, `tsc` clean

Implemented per `docs/audits/09-database.md`. Only the enumerated quick wins were
applied; items that need a product decision or a feature to land first are
documented below (deferred), per the phase rules.

---

## Applied

### D3 — Redundant indexes removed (schema)

Postgres already builds an index for `@unique` constraints; the duplicate
`@@index` lines were deleted (zero behavior change, less write amplification):

- `User` — removed `@@index([clerkId])` and `@@index([email])`
- `ShareLink` — removed `@@index([token])`

### D5 — Missing `Message.parentId` index added (schema)

`Message` self-relates via `parentId` (message chains / threads / comments) but
had no index. Added `@@index([parentId])`. `[chatId, createdAt]` and
`[chatId, feedback]` are unchanged.

### D1 — pgvector migration prepared, NOT enabled

`prisma/migrations/pgvector_embeddings_pending.sql` contains the full HNSW
migration (extension, `embedding_vec vector(1536)`, cosine index, backfill, and
the similarity query sketch) **commented out**. It must not run until:

1. The embedding model dimension is confirmed (placeholder 1536).
2. Neon `CREATE EXTENSION vector` is available (direct connection, not pooled).
3. `KnowledgeService.search` is rewritten to the vector query.

The existing `Json` embedding column stays as the source of truth / fallback —
RAG keeps working in-process today.

### D2 — Retention policy for unbounded tables

`prisma/migrations/retention_policy.sql` — idempotent, schedule-daily SQL:
- `UsageRecord` older than 90 days deleted (one row per AI call otherwise grows
  forever).
- Read `Notification`s older than 90 days deleted (unread always kept).

The message-content cap the audit called out was **already enforced** at write
time: the chat message route validates `content: z.string().min(1).max(10000)`.

### D11 — Documented the nullable-draft uniqueness quirk

Added a schema comment on `Draft.@@unique([userId, chatId])` explaining the
Postgres NULL-distinct semantics (many untethered drafts allowed, non-null chatId
unique) so it is not "fixed" into a broken partial index later.

---

## Verified but deferred (with reasons)

| Item | Why deferred |
|---|---|
| **D4** Usage counter soup (`resetDate`, `periodEnd`, `lastDailyReset`, `lastMonthlyReset`) | Removing columns is a breaking schema change; the daily/monthly counters **are** consumed by `UsageService.getStats`. Note: the audit's claim that daily/monthly are dead is partially wrong — only `resetDate`/`periodEnd`/`last*Reset` are write-only today. Recommend a dedicated schema cleanup when the usage API freezes its shape. |
| **D6** Project-deletion semantics | Product decision (SetNull vs Cascade per child model) — flagged for product owner; currently chats=SetNull, personas/prompts/knowledge=Cascade. |
| **D7** `Bookmark` loose FKs | The bookmark model is ahead of the client (bookmarks are localStorage-only today). Add `chat`/`message` relations with `onDelete: Cascade` when the server-backed bookmark feature lands. |
| **D9** `User.defaultPersonaId` loose string | Either add a `Persona?` FK with `onDelete: SetNull` or clear it in `PersonaService.delete` — bundle with the personas API work. |
| **D10** String "enums" | Fine for iteration; a `STATUS_*` constants module can be added when branching logic grows. |

---

## Files changed

- `prisma/schema.prisma` — index dedup, `Message.parentId` index, schema comments
- `prisma/migrations/pgvector_embeddings_pending.sql` — **new**, prepared (not enabled)
- `prisma/migrations/retention_policy.sql` — **new**, schedule-daily cleanup
- `docs/migrations/phase-8.14-database.md` — this report

## Verification

```
npx prisma validate   ✅ valid
npx prisma format     ✅ formatted
npx tsc --noEmit      ✅ 0 errors
```

## Next steps (blocked / owned elsewhere)

- pgvector enablement — needs embedding-model dimension decision (see pending SQL)
- Retention scheduling — wire `retention_policy.sql` into a daily cron / Vercel Cron
- D4/D6/D7/D9 — listed above, each with an explicit trigger
