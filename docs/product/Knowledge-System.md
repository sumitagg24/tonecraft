# Knowledge System — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.1 (first feature after the Phase 7 UI/UX rewrite).
> **Depends on:** P1 Compose (built), upload API (`/api/upload`, R2) partially
> existing, capabilities/limits framework (built).

---

## 1. Purpose

Let users upload documents the AI can use while generating responses. The AI
retrieves relevant passages from the user's documents at generation time and
grounds its answer in them — with citations.

**Example journey:**

1. User uploads `company.pdf`.
2. ToneCraft extracts text, chunks it, and indexes embeddings.
3. Later, the user writes: *"Write an email following our company policy."*
4. ToneCraft retrieves the policy passages, injects them into context, and
   answers **with a citation chip** pointing to `company.pdf` §3.2.

This is the difference between a chatbot and a *communication assistant that
knows your business.*

---

## 2. User flow

```
Compose                        Knowledge Library
   │                                  │
   ├─ Attach from chat ──────────────►│  (file chips, attach to message)
   │                                  │
   └─ "Use knowledge" toggle ─────────┘  (per-message grounding)
                                        │
                                        ▼
                              Upload / manage files
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            ▼                           ▼                           ▼
         Status:                       List:                     Detail:
         indexing → ready → failed    search, filter, sort      source chips,
         (progress)                   select for grounding      reindex, delete
```

### Detailed flow

1. **Upload** — drag & drop or file picker from (a) Knowledge Library or
   (b) composer attachment button. Validation (type, size, count) runs
   immediately, per plan limits.
2. **Index** — file is stored in R2; a background job extracts text, chunks,
   embeds, and persists vectors. UI shows a per-file status
   (`uploading → extracting → indexing → ready | failed`).
3. **Grounding** — while composing, the user enables knowledge grounding
   (global default + per-message override). The AI context builder retrieves
   the top-k passages across **selected** files (library default: all user's
   files; chat-level: files attached to that chat).
4. **Answer** — the model writes with the retrieved passages in context and
   emits citation markers rendered as source chips beneath the message.
5. **Manage** — rename, delete, reindex, download, toggle "always ground on
   this file", share (Phase 8.7+).

---

## 3. Upload flow

1. Client validates MIME + size + extension against allowlist and plan quota.
2. Client POSTs multipart to `/api/upload` (existing route) → R2 object stored
   at `uploads/{userId}/{uuid}-{safeName}`.
3. Server creates a `KnowledgeFile` row in `status = UPLOADING`, then enqueues
   an indexing job.
4. Worker:
   a. Downloads object from R2 (or streams).
   b. Extracts text (`pdf-parse`, `mammoth`, `markdown-it`, plain text).
   c. Chunks text (~512 tokens, 128 overlap).
   d. Embeds each chunk (hosted embeddings API).
   e. Writes `KnowledgeChunk` rows + vector index (pgvector column).
   f. Sets status `READY` (or `FAILED` with a message).
5. Client polls `/api/knowledge/{id}` (or subscribes via SSE/notification)
   until `READY`.

**Failure paths:** unsupported file → rejected pre-upload; no extractable text
→ `FAILED "no text extracted"`; embedding error → retry with backoff; quota
exceeded → 402-style response with upgrade prompt.

---

## 4. Supported file types (MVP → later)

| Category | MVP | Later |
|---|---|---|
| Documents | PDF, DOCX, TXT, MD | EPUB, RTF, ODT, HTML |
| Spreadsheets | CSV | XLSX (with sheet selection) |
| Presentations | — | PPTX |
| Code | — | 20+ languages |
| Images | — | OCR (vision model), screenshots, diagrams |
| Web | — | URL capture, web pages (bypass paywalls via ?) |
| Audio | — | Transcripts (ASR), meeting notes |

Hard cap on single file size: **25 MB MVP**, **50 MB premium** (per file).

---

## 5. Vector indexing architecture

```
                ┌──────────────┐     chunking      ┌──────────────┐
  uploaded file │  extractor   ├──────────────────►│   chunker    │
                └──────────────┘                   └──────┬───────┘
                                                          │
                                                          ▼
                                             ┌────────────────────────┐
                                             │  embedding service     │
                                             │  (hosted embeddings)   │
                                             └───────────┬────────────┘
                                                         ▼
                                             ┌────────────────────────┐
                                             │  pgvector (Postgres)   │
                                             │  KnowledgeChunk + vec  │
                                             └────────────────────────┘
```

- **Store:** pgvector on the existing Postgres (no new database). `vector(1536)`
  column on `KnowledgeChunk`.
- **Embeddings:** hosted API (OpenAI `text-embedding-3-small` for cost), model
  id stored per chunk so re-embedding is possible after model upgrades.
- **Job queue:** in-DB job table (`KnowledgeJob`) processed by a polling worker
  (Vercel cron or a lightweight worker). Simpler than adding a queue broker in
  MVP; swap to a real queue when volume demands.
- **Reindex:** delete chunks for the file and rerun; supports embedding model
  upgrades.

---

## 6. Embedding flow

1. Extract plain text from the document.
2. Normalize (trim, collapse whitespace, decode entities).
3. Split into chunks of ~512 tokens with ~128-token overlap; split on
   paragraph/sentence boundaries when possible; keep heading context.
4. Store chunk text + metadata (`{fileId, chunkIndex, page?, heading?}`).
5. Generate embeddings in batches (≤128/batch).
6. Persist each `KnowledgeChunk` row with its vector + all metadata.
7. Mark file `READY`; update `Usage.storageUsed` + `filesUploaded`.

Embedding errors are retried up to 3× with exponential backoff; permanent
failures mark the file `FAILED` with the reason surfaced in the UI.

---

## 7. Retrieval flow

1. At generation time, the context builder receives the message + optional
   selected file ids + chat-level file bindings.
2. Embed the user message (same embedding model).
3. Cosine-similarity query over the **scoped** chunk set
   (selected files → chat files → all user files, in that precedence).
4. Return top-k chunks (default **k=6**, min similarity **0.35**, overridable
   per plan) with their metadata.
5. If no chunk passes the threshold → knowledge context is omitted (honest
   "no relevant knowledge found" note instead of fabricating).
6. Inject as a `knowledge` block in the prompt with per-chunk citation ids.

---

## 8. AI context injection

Prompt shape (addition to the existing context builder):

```
[Knowledge]
Based on the user's documents, here are relevant passages:

[1] source=company.pdf, page=3, heading="Expense Policy"
  "Travel expenses must be pre-approved..."

[2] source=company.pdf, page=4, heading="Approval Chain"
  "Any expense over $500 requires manager approval..."

Instructions:
- Use the passages above to answer. Cite them inline as [1], [2].
- If the passages do not answer the question, say so — do not invent.
```

Response renderer maps `[n]` markers to citation chips under the message
(`KnowledgeCitation` component) linking back to the source file + chunk.

---

## 9. Limits & plans

| Limit | Free | Pro | Team |
|---|---|---|---|
| Files per user | 5 | 50 | 200 |
| Total storage | 25 MB | 1 GB | 10 GB |
| Max file size | 10 MB | 25 MB | 50 MB |
| Retrieval k per message | 3 | 6 | 10 |
| Chunks per file | 200 | 2,000 | 10,000 |
| Indexing queue priority | low | normal | high |
| OCR | — | — | later |

Limits are enforced at upload (reject) and at embed (cap chunks), using the
existing `capabilities.ts` / plan framework.

---

## 10. Database changes (design)

New models (Prisma):

```prisma
model KnowledgeFile {
  id          String            @id @default(cuid())
  userId      String
  name        String
  mimeType    String
  sizeBytes   Int
  storageKey  String
  status      String            @default("UPLOADING") // UPLOADING|EXTRACTING|INDEXING|READY|FAILED
  error       String?
  chunkCount  Int               @default(0)
  embeddingModel String?
  projectId   String?           // Phase 8.2
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  chunks      KnowledgeChunk[]
  user        User              @relation(...)
  @@index([userId, status])
  @@index([userId, projectId])
}

model KnowledgeChunk {
  id            String        @id @default(cuid())
  fileId        String
  index         Int
  content       String
  heading       String?
  page          Int?
  metadata      Json?
  vector        Unsupported("vector(1536)")?
  embeddingModel String?
  file          KnowledgeFile @relation(...)
  @@index([fileId, index])
}

model KnowledgeJob {
  id        String   @id @default(cuid())
  fileId    String
  type      String   // EXTRACT | EMBED | REINDEX
  status    String   // PENDING|RUNNING|DONE|FAILED
  attempts  Int      @default(0)
  error     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([status, createdAt])
}
```

**Migration concerns:** pgvector extension (`CREATE EXTENSION vector;`) added
to the database; `Attachment` model remains message-bound (legacy), while
`KnowledgeFile` becomes the first-class library entity. A link table
(`MessageKnowledge`) records which files grounded each message for citation
history.

---

## 11. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/knowledge` | Multipart upload → create `KnowledgeFile` + enqueue job |
| GET | `/api/knowledge` | List files (paged, filter by status/project/search) |
| GET | `/api/knowledge/[id]` | File detail + status + chunk count |
| PATCH | `/api/knowledge/[id]` | Rename, reindex, toggle settings |
| DELETE | `/api/knowledge/[id]` | Delete file + chunks + R2 object |
| GET | `/api/knowledge/[id]/download` | Signed download URL |
| GET | `/api/knowledge/[id]/chunks` | Inspect extracted chunks (power user) |
| POST | `/api/knowledge/search` | Embed a query + return top chunks (debug/tool) |
| POST | `/api/chats/[chatId]/messages` | (extended) accept `knowledgeFileIds` for grounding |
| GET | `/api/knowledge/jobs` | Admin: queue depth, failures |

All endpoints user-scoped via `auth()`; project-scoping arrives in 8.2.

---

## 12. Frontend architecture

- **`KnowledgeLibrary`** (`/library/knowledge`): file grid/cards, upload
  dropzone, status badges (spinner → check → error), search/filter, delete.
- **`KnowledgeStatusBadge`** — shared status pill used in library + composer.
- **`ComposerKnowledgeToggle`** — per-message grounding toggle (globe/book
  icon) with count of active files.
- **`MessageKnowledgeChips`** — citation chips under assistant messages;
  click → file detail + highlighted chunk.
- **`useKnowledge` hook** — list/upload/delete/status with optimistic updates
  (mirrors `use-chat` patterns).
- **File attach in compose** — reuses the existing attachment flow; on send,
  uploaded files create `KnowledgeFile` + a `MessageKnowledge` link.

State lives in a `knowledge-store` (zustand) mirroring `chat-store` conventions;
suspense + skeletons match `PageSkeleton`/`SuspenseSection` patterns.

---

## 13. Security

- Uploads are scanned for type by magic bytes (not just extension) and MIME.
- File content is never served raw without auth; downloads use signed,
  expiring URLs (R2 presigned).
- Knowledge is **user-scoped by default**; project scope (8.2) enforces
  project membership at both query and retrieval time.
- Injection is defense-in-depth: chunk content is inserted as data, not
  instructions; instruction framing is fixed server-side.
- No secrets, no client-side text extraction of sensitive docs beyond what the
  user explicitly selected; extraction runs server-side.
- Per-file delete removes vectors + R2 object atomically.

---

## 14. Future improvements

- OCR for images/scanned PDFs (vision model).
- Web/URL capture with per-source freshness.
- Multi-file "knowledge sets" and semantic search over the library.
- Automatic file linking to chats based on topic.
- Team-shared knowledge (8.7 permissions).
- Citation confidence scores + "sources used" summary.
- Streaming-aware retrieval (retrieve mid-stream on follow-up questions).
- Local-first indexing for on-prem/enterprise.

---

## 15. Comparison: ChatGPT Projects vs Claude Knowledge

| Aspect | ChatGPT Projects | Claude Projects (Knowledge) | ToneCraft Knowledge (target) |
|---|---|---|---|
| Model | Files are indexed but grounding is implicit | Explicit "knowledge" docs, cited inline | Explicit grounding + citations + per-message toggle |
| Citation | None visible | `[1]`, `[2]` inline citations | `[n]` + clickable source chips |
| Control | Attach whole project files | Whole-project knowledge | Per-file + per-message selection |
| Discovery | File list only | Folder list | Searchable library + chunk inspector |
| Retrieval visibility | None | "relevant" indicator | Similarity threshold + chunk inspection |
| Reuse across orgs | No | No | Team knowledge (8.2/8.7) |
| Format support | txt, pdf, docx, md… | pdf, txt, md… | TXT/MD/PDF/DOCX/CSV MVP + OCR/code later |

**Differentiator:** ToneCraft exposes *retrieval you can trust and control* —
user-visible citations, per-message grounding, and honest "no relevant
knowledge" states — instead of opaque project-wide magic.
