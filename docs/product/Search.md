# Universal Search — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.5.
> **Depends on:** 8.2 Projects, 8.3 Personas, 8.4 Prompt Library (it indexes
> those entities). A partial search service + `/api/search` + a search UI
> already exist; this spec unifies and extends them.

---

## 1. Purpose

One search across **everything**:

```
Chats  Projects  Messages  Prompts  Knowledge  Personas  Files  Bookmarks
```

Today search is partial (chats + messages via `SearchService`). Universal
Search makes every entity retrievable from a single keyboard-first surface —
the Search page and ⌘K.

---

## 2. User flow

```
⌘K or /search
    │
    ├── Type a query
    ├── Results grouped by entity (Chats | Messages | Projects | Prompts | Files | Personas)
    ├── Filter by entity / project / date
    ├── Keyboard: ↑↓ navigate, Enter open, Esc dismiss
    └── Click result → deep link to the item
```

- **⌘K** (existing palette) becomes search-first: query in, grouped results
  out; commands become a secondary tab.
- **Search page** (`/search`) is the rich surface: full filtering, snippets,
  last-search persistence.
- **Per-entity filters**: scope to one entity type, one project (8.2), or a
  date range.

---

## 3. What is searchable

| Entity | Indexed fields | Result surface |
|---|---|---|
| Chats | title, recent message preview | Link to chat |
| Messages | content (assistant + user) | Link to message (scroll + highlight) |
| Projects | name, description, folder | Link to project |
| Prompts | title, description, category, tags, body | Link to prompt (8.4) |
| Knowledge | file name, chunk content | Link to file + highlighted chunk (8.1) |
| Personas | name, description | Link to persona (8.3) |
| Files (attachments) | file name | Link to message with attachment |
| Bookmarks | bookmarked message content | Link to bookmarked message |
| Folders | name | Link to project folder |

---

## 4. Search architecture

```
query
  │
  ├─ Lexical pass (Postgres full-text / ILIKE) — fast, cheap, default
  ├─ Semantic pass (embeddings) — for messages + knowledge (8.1 vectors)
  └─ Combine + rank
```

- **Lexical default:** Postgres `tsvector`/`ILIKE` over the indexed columns,
  per entity, unioned with type metadata. Cheap, predictable, no new infra.
- **Semantic boost:** for messages and knowledge, reuse the knowledge embedding
  infrastructure (8.1) — embed the query and cosine-match. Applied only when
  the lexical pass is weak (or premium flag).
- **Ranking:** score = text match weight + recency decay + entity boost
  (chats > messages > others). Configurable weights live in a single file.
- **Federation:** each entity is a repository query (`ChatRepository.search`,
  etc.); `SearchService` fans out, merges, ranks, paginates.
- **Index freshness:** MVP searches the live database (small enough); a
  materialized index/TS vector column is added only when query latency
  warrants it.

---

## 5. Filters & facets

- Entity type (multi-select).
- Project scope (8.2).
- Date range (createdAt/updatedAt).
- Exact phrase / exclude terms (basic operators: `"…"`, `-term`).
- Bookmarks only toggle.

---

## 6. Result interaction

- **Deep links:** each result navigates to the item; messages scroll into view
  and **highlight the matched text** (a `<mark>` rendered from the snippet —
  must be sanitized).
- **Snippets:** matched context around the hit, with the query term
  highlighted.
- **Keyboard:** `/` focuses search, ↑↓ navigate, Enter open, Esc back.
- **Recent searches** (localStorage) + **saved searches** (premium, server).

---

## 7. Database changes (design)

No new models for MVP. Optional enhancements:

```prisma
model SearchIndex {
  id        String   @id @default(cuid())
  userId    String
  entityType String  // chat|message|project|prompt|knowledge|persona|bookmark
  entityId  String
  title     String
  snippet   String?
  content   String?
  ts        Unsupported("tsvector")?   // optional full-text column
  updatedAt DateTime @updatedAt
  @@index([userId, entityType])
}
```

MVP strategy: **query the live tables directly** (each repository already
supports `search(userId, query)`). The `SearchIndex` table is the
optimization path if latency or join complexity becomes a problem — it is not
required for the feature to work.

---

## 8. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/search?q=&type=&project=&from=&to=` | Unified search (extends existing route) |
| GET | `/api/search/recent` | Recent searches (localStorage or server) |
| POST | `/api/search/saved` | Save a search (premium) |
| DELETE | `/api/search/saved/[id]` | Remove saved search |
| GET | `/api/search/suggest` | Type-ahead suggestions (prefix match) |

`/api/search` returns a single grouped payload:

```json
{
  "query": "launch",
  "groups": {
    "chats":  [{ "id", "title", "snippet", "updatedAt" }],
    "messages": [{ "id", "chatId", "content", "role", "highlight" }],
    "projects": [...], "prompts": [...], "knowledge": [...], "personas": [...]
  },
  "total": 42
}
```

---

## 9. Frontend architecture

- **`SearchDialog`** — replaces the palette's search tab; overlay with grouped
  results, filters, keyboard nav (reuses command-palette shell).
- **`SearchPage`** — `/search`: full surface with facets, saved searches,
  recent, empty/loading states (skeletons).
- **`SearchResultItem`** — per-entity row with icon, title, snippet
  (highlighted), entity badge, project chip.
- **`SearchGroup`** — entity group header with "view all" → filtered page.
- **`useSearch` hook** — debounced query, abort on stale results (pattern
  already in `use-search`), grouped results state.
- **Highlighting:** server returns snippet with entity boundaries; client
  renders with `<mark>` — `dangerouslySetInnerHTML` never used (sanitized
  via existing `dompurify`).

---

## 10. Security

- Every query is `userId`-scoped server-side; `project` filter enforces
  membership (8.2/8.7).
- Snippets are truncated + sanitized before returning; no raw HTML.
- Search does not index private fields (e.g., storage keys, internal ids).
- Rate-limited via the existing Upstash ratelimit framework to prevent
  enumeration.

---

## 11. Future improvements

- Full semantic search over all entities (embedding index for everything).
- Cross-user search for team/workspace (8.7) with permission-aware results.
- "Ask AI" mode: natural-language query answered over the user's data.
- Search analytics (top queries, no-result queries).
- Offline search cache (8.9/8.8 offline layer).
