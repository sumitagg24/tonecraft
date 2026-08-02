# Database Audit — 09 (Prisma schema)

Date: 2026-08-02 · Scope: `prisma/schema.prisma` (25 models) + the queries that hit it (repositories, services, API routes). Read-only; nothing modified. Provider: PostgreSQL (Neon), Prisma 7 + `@prisma/adapter-pg`.

Status summary:

- **High: 4** — embeddings not vector-searchable (RAG blocker), unbounded table growth, redundant indexes, usage-counter dead weight.
- **Medium: 4** — missing `Message.parentId` index, inconsistent project-deletion semantics, loose bookmark FKs, unused credit-period fields.
- **Low: 4** — loose `defaultPersonaId`, string enum fields, nullable-unique draft quirk, minor naming.

---

## High

### D1. Embeddings are `Json`, not `vector` — the RAG path can't scale (High)

`KnowledgeChunk.embedding Json?` — similarity search would require loading embeddings into JS and scoring in-process (O(n) per query, no index). For any real RAG usage (Phase 8.4 is live: retrieval API at `knowledge/search`), move to pgvector:

```sql
-- migration sketch
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "KnowledgeChunk" ADD COLUMN embedding_vec vector(1536);
CREATE INDEX kn_chunk_embedding_idx ON "KnowledgeChunk" USING hnsw (embedding_vec vector_cosine_ops);
```

Keep the `Json` column only as a migration buffer, or drop it once `vector` is live. Also add `@@index([fileId])` is already present via `[fileId, index]` (good for chunk joins). Embedding dimension must match the embedding model (`src/lib/knowledge/` — verify the chosen model's output size before the migration).

### D2. Unbounded growth tables — no retention policy (High, production)

- **`UsageRecord`** — one row per AI call, on the hot path (`AIEngine.trackUsage`). This table grows at message rate forever.
- **`Notification`** — one row per event; only user-initiated `clearAll` ever removes rows.
- **`Message`** content has no length cap (a 500 KB pasted message is stored verbatim).

Fix: retention job (delete `UsageRecord` > 90 days, read `Notification`s > 90 days), optionally archive to cold storage; cap message size at write time (zod + a server-side byte check — upload caps are already enforced elsewhere, mirror that).

### D3. Redundant indexes from `@unique` + `@@index` (Low effort, instant win)

These create the same index twice (Postgres already builds one for a unique constraint):

- `User.clerkId` — `@unique` + `@@index([clerkId])`
- `User.email` — `@unique` + `@@index([email])`
- `ShareLink.token` — `@unique` + `@@index([token])`

Fix: delete the three `@@index` lines. Zero behavior change; less write amplification.

### D4. `Usage` counter soup — daily/monthly resets are never implemented (High)

`Usage` carries `messagesSent/tokensUsed/creditsUsed` **and** `dailyMessages/dailyTokens` **and** `monthlyMessages/monthlyTokens` **and** `resetDate/periodStart/periodEnd/lastDailyReset/lastMonthlyReset`.

- `AIEngine.trackUsage` increments the daily+monthly counters, but **no code path resets them** (only `UsageGuard.resetPeriod` resets `creditsUsed`).
- `resetDate` is set to `now()+30d` in `AIEngine.ts` but never read anywhere.
- `periodEnd` is never written.

Fix: pick one accounting scheme. Recommended: keep `creditsUsed + periodStart` for credit math (already correct in `UsageGuard`), keep the counters the analytics actually consume (analytics queries read `messagesSent/tokensUsed` + date), and delete the daily/monthly/`resetDate`/`periodEnd`/`last*Reset` columns or implement their resets. Document the chosen scheme in `docs/product/` so future analytics work doesn't invent a fourth one.

---

## Medium

### D5. Missing index on `Message.parentId` (Medium)

`Message` self-relates via `parentId` (`"MessageChain"`), but only `[chatId, createdAt]` and `[chatId, feedback]` are indexed. Any lookup by parent (chain navigation, threaded views — and the upcoming comments/threads work) is a seq scan. Add `@@index([parentId])`.

Also: `[chatId, feedback]` is rarely used (feedback is read per-message) — keep or drop; it's cheap.

### D6. Inconsistent project-deletion semantics (Medium)

Deleting a project:
- `Chat.projectId` → `onDelete: SetNull` (chats survive as "unfiled")
- `Persona.projectId` → `Cascade` (personas deleted)
- `Prompt.projectId` → `Cascade` (prompts deleted)
- `KnowledgeFile.projectId` → `Cascade` (knowledge deleted)
- `ProjectMember` → `Cascade` (correct)

Mixed semantics — a user who archives/deletes a project silently loses personas, prompts, and knowledge but keeps chats. Decide and document: either all-`SetNull` (preserve user content; it's just org) or all-`Cascade` (project = throwaway container), then reconcile. Also note `Project.parent` (self-relation) defaults to `SetNull` on delete — deleting a parent project orphans its children at the root level; consider `Cascade` with a "has children" guard in the delete route.

### D7. `Bookmark` has loose FKs (Medium)

`Bookmark.chatId` / `Bookmark.messageId` are plain strings with **no relations** (only `promptId` is a real FK). Bookmarks survive message/chat deletion as dangling rows, and there's no referential integrity.

Fix: add `chat Chat? @relation(...)` + `message Message? @relation(...)` with `onDelete: Cascade`, or a delete-side cleanup in `BookmarkRepository` (one doesn't exist yet — bookmarks are localStorage-only in the UI today, so this model is ahead of the client; decide whether the model should exist at all until the server-backed bookmark feature lands).

### D8. Unused credit-period fields (`Usage`)

Covered by D4. Listed separately so the schema cleanup is unambiguous: `periodEnd`, `resetDate`, `lastDailyReset`, `lastMonthlyReset` are write-only today.

---

## Low

### D9. `User.defaultPersonaId` is a loose string (Low)

No FK and no `onDelete` behavior: deleting the default persona leaves a dangling id (the settings UI likely falls back gracefully, but nothing enforces it). Either add `persona Persona? @relation("DefaultPersona", fields:[defaultPersonaId], references:[id], onDelete: SetNull)` or clear it in `PersonaService.delete`.

### D10. String "enums" everywhere (Low)

`status` (`KnowledgeFile`, `KnowledgeJob`, `ExportJob`), `role` (`Message`, `ProjectMember`, `ShareLink`), `plan`/`status` (`Subscription`), `feedback` (`Message`), `category` (`Prompt`) are all raw strings. Fine for iteration speed; if any become branching logic (they do — `status === "pending"` checks), consider Postgres enums or a `String` + documented constants file (`src/lib/constants.ts` has partial coverage). At minimum add a `const STATUS_*` constants module and stop scattering string literals.

### D11. `Draft.@@unique([userId, chatId])` with nullable `chatId` (Low)

Postgres treats NULLs as distinct in unique indexes, so a user can have many drafts with `chatId = null` (fine — that's the "untethered draft" case). Non-null `chatId` is correctly unique. This is actually the desired behavior; note it in the schema comment so nobody "fixes" it into a partial index without realizing the NULL semantics.

### D12. Naming consistency (Low)

- `KnowledgeFile` ↔ `knowledgeFiles` plural on relations — fine.
- `MessageKnowledge` (join) vs `KnowledgeChunk`/`KnowledgeJob` — consistent enough.
- `Comment` has no `chatId` — comments hang off `messageId` only; fine, but a message→chat traversal is one extra hop for "all comments in a chat".

---

## Index coverage audit (per query pattern)

| Pattern | Covered? |
|---|---|
| Recent chats per user | ✔ `[userId, updatedAt]` |
| Pinned/fav/archived filters | ✔ `[userId, isPinned]` etc. |
| Messages per chat, in order | ✔ `[chatId, createdAt]` |
| Message chains via parent | ✘ add `[parentId]` (D5) |
| Personas per user / per project | ✔ `[userId]`, `[projectId]` |
| Prompts per user by category | ✔ `[userId, category]`, `[projectId]` |
| Knowledge per user / project+status | ✔ `[userId]`, `[projectId, status]` |
| Chunks per file | ✔ `[fileId, index]` |
| Chunk vector similarity | ✘ pgvector HNSW (D1) |
| Notifications unread list | ✔ `[userId, readAt]`, `[userId, createdAt]` |
| UsageRecord history | ✔ `[userId, createdAt]` (retention needed — D2) |
| Comments per message | ✔ `[messageId, createdAt]` |
| Members per project/user | ✔ unique `[projectId, userId]` + `[userId]` |
| Draft per user recent | ✔ `[userId, updatedAt]` |

## RAG readiness summary

- ✅ Chunking (`src/lib/knowledge/chunk.ts`), extraction (`extract.ts`), retrieval API (`knowledge/search`), and `MessageKnowledge` citation links exist.
- ❌ Embeddings stored as JSON — no vector column/index; similarity is in-process today.
- ❌ No rerank / relevance threshold surfaced to the prompt builder (knowledge goes in as a raw system block — security L1 / audit 10-A6).
- Next step: pgvector migration (D1), embedding-dimension alignment with the embedding model, and a cosine-similarity query in `KnowledgeService`.

## Migration order

1. D3 index dedup (drop 3 `@@index` lines) — no risk.
2. D5 `[parentId]` index — no risk.
3. D1 pgvector (needs embedding-model decision) — feature-critical for RAG.
4. D4 usage-column cleanup (code + schema together).
5. D6 project-deletion semantics (product decision first).
6. D7/D9 FK additions — after the bookmark/default-persona features are server-backed.
