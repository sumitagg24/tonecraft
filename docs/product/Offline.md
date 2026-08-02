# Offline & Draft System — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.8 (draft/autosave) + offline layer feeding 8.9/8.10.
> **Depends on:** Compose (drafts live in the composer), 8.7 (version history
> builds on autosave). The app is a Next.js client/server app — true offline is
> a progressive enhancement, not a hard requirement at launch.

---

## 1. Purpose

**Never lose work.** Two intertwined systems:

1. **Draft & Autosave** — every keystroke in the composer is safe; refresh,
   crash, or tab-close can't destroy a draft.
2. **Offline** — when the network drops, the composer keeps working (local
   queue, queued sends, recovery) and syncs when back online.

| Feature | What it means |
|---|---|
| Autosave | Composer state persisted (debounced) without user action |
| Recovery | Reopen a session after refresh/crash → restored draft |
| Offline draft | Drafting works with no connection |
| Restore session | Crash → "Restore draft?" banner |
| History | Version snapshots of drafts (feeds 8.7 version history) |

---

## 2. Draft & Autosave

### Flow

```
Composer input (debounce 800ms)
    → snapshot { chatId, draft, tone, persona, context, attachments(metadata), cursor }
    → persist (localStorage + server Draft row when authenticated)
    → on refresh: "Draft restored" banner if snapshot newer than server
    → on send: clear draft snapshot
```

- **Local-first:** localStorage is the source of truth for the *draft itself*
  (instant, offline-safe). Server `Draft` rows are the cross-device backup.
- **Conflict:** compare `updatedAt`; newer wins; banner offers "Keep mine /
  Use saved".
- **Scope:** one draft per chat, plus a composer "scratchpad" draft for
  pre-chat writing.
- **Autosave off:** users can disable autosave (existing `User.autoSave` flag
  already exists in the schema).

### Recovery UX

- On chat load: if a local draft exists and differs from server, show a
  `DraftRestoreBanner`: "Resume your draft" (restore) / "Discard".
- Crash recovery: a `beforeunload`/`visibilitychange` flush writes the
  snapshot synchronously (or best-effort via `sendBeacon`).
- Draft tray (sidebar section): list of chats with saved drafts + the
  scratchpad; click to resume.

---

## 3. Offline architecture

```
Online ──► normal path
    │
Offline ──► service worker caches shell + assets
            composer still editable (draft saved locally)
            sends queued in IndexedDB outbox (pending[])
            knowledge/composer actions marked "pending"
    │
Reconnect ──► sync queue: flush sends, reconcile drafts, clear pending
```

### Layers

1. **Service worker (workbox)** — cache app shell (static chunks, fonts,
   icons); runtime caching for GET APIs (chats list read-only).
   *Next.js `next-pwa` or a manual `public/sw.js` — MVP: minimal shell cache
   only, not full app offline.*
2. **IndexedDB outbox** — queued send actions `{id, type, payload, createdAt}`
   with retry on reconnect; dedupe by idempotency key so a double-send is
   impossible.
3. **Store state** — `chat-store`/new `offline-store` track
   `{ online, pending[], syncing }`; a connection listener flips the flag and
   triggers flush.
4. **Draft store** — the same localStorage draft layer as §2 (works offline by
   construction).

### Offline limits (honest)

- **Generation requires network** — no on-device model. Offline mode supports
  *drafting, editing, queuing sends, browsing cached chats*; generation
  resumes/retries on reconnect.
- Uploads require network (or are queued like sends).
- Knowledge retrieval requires network (server-side vectors).

---

## 4. Sync behavior

| Item | Offline | On reconnect |
|---|---|---|
| Composer draft | Saved locally | Pushed to server Draft (if newer) |
| Send message | Queued in outbox | Flushed with idempotency key |
| Edits / feedback | Queued | Flushed |
| Chat list | Cached | Refreshed |
| Knowledge attach | Queued | Flushed |
| Bookmarks | Local (already local) | n/a |

Reconnect detection: `online`/`offline` events + heartbeat; flush runs once,
marks pending done, shows a toast "x items synced".

---

## 5. Version history

- Every autosave snapshot with content change becomes a `DraftVersion` row
  (or a `MessageVersion` when editing a sent message).
- **Throttle:** max one version per 10s and a per-item cap (e.g., 50 versions),
  oldest dropped — storage growth is bounded.
- **Surface:** "History" in the composer kebab / message edit menu → list of
  versions with timestamps → preview → restore (creates a new version).
- **8.7 bridge:** collaboration "edited by X" entries reuse the same version
  rows.

---

## 6. Database changes (design)

```prisma
model Draft {
  id        String   @id @default(cuid())
  userId    String
  chatId    String?
  scratch   Boolean  @default(false)   // pre-chat scratchpad
  content   String   @default("")
  tone      String?
  personaId String?
  context   Json?
  metadata  Json?    // attachment refs, cursor, selection
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, chatId])   // one draft per chat (null chatId for scratch)
  @@index([userId, updatedAt])
}

model DraftVersion {
  id        String   @id @default(cuid())
  draftId   String?
  messageId String?  // for editing sent messages
  content   String
  source    String   // autosave|manual|restore
  createdAt DateTime @default(now())
  draft     Draft?   @relation(fields: [draftId], references: [id], onDelete: Cascade)
  message   Message? @relation(fields: [messageId], references: [id], onDelete: Cascade)
  @@index([draftId, createdAt])
  @@index([messageId, createdAt])
}
```

`@@unique([userId, chatId])` with `chatId` nullable needs a partial-unique
workaround in Postgres (nulls are distinct) — scratch draft uses a sentinel
`chatId = "scratch"` instead to keep the unique constraint clean.

---

## 7. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/drafts?chatId=` | Fetch draft(s) (incl. scratch) |
| PUT | `/api/drafts` | Upsert draft (idempotent by chatId) |
| DELETE | `/api/drafts?chatId=` | Clear draft after send/discard |
| GET | `/api/drafts/[id]/versions` | Version list for a draft/message |
| POST | `/api/drafts/[id]/versions` | Manual snapshot (restore point) |
| POST | `/api/outbox/sync` | Flush queued offline actions (batch, idempotent) |
| GET | `/api/outbox/status` | Pending count + last sync (admin/debug) |

`POST /api/outbox/sync` accepts a batch `[{key, type, payload}]`, dedupes by
idempotency key, applies sequentially, and returns per-item results.

---

## 8. Frontend architecture

- **`DraftRestoreBanner`** — shown on load when a newer local draft exists.
- **`DraftTray`** — sidebar section listing chats with drafts + scratchpad.
- **`OfflineIndicator`** — subtle pill when offline; switches composer to
  "queued" send state.
- **`SyncBar`** — transient "Syncing n items…" / "Synced" state on reconnect.
- **`HistoryDialog`** — version list → preview → restore.
- **`useDraft` hook** — debounced save, restore, conflict resolution.
- **`useOffline` hook + `offline-store`** — online flag, pending queue,
  flush-on-reconnect.
- **Composer integration:** send button disabled + "queued" label when offline;
  draft snapshot includes tone/persona/context so a restored session is
  complete, not just text.

---

## 9. Security

- Drafts are user-scoped; drafts of project chats are membership-scoped (8.2).
- Drafts never contain secrets; attachments referenced by id (not content).
- Outbox sync is idempotency-keyed to prevent replay/duplicates.
- Autosave respects plan storage caps (draft size limits) — drafts are text +
  small metadata, not file uploads.

---

## 10. Future improvements

- Full PWA: installable, complete offline read of chats/knowledge.
- On-device lightweight model for offline tone suggestions (big later win).
- Offline queue for exports and knowledge uploads.
- Cross-device draft sync with realtime conflict resolution.
- Version history diff view + "compare" mode.
