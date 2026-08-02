# Notifications — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.9.
> **Depends on:** event sources from 8.1 Knowledge (indexed), 8.6 Export
> (complete), 8.7 Collaboration (invites). Existing "notification" toggles are
> **local-only and honest ("soon")** — this spec builds the real thing.

---

## 1. Purpose

Real notifications for events users care about:

```
Generation finished      Credits low
Team invite              Knowledge indexed
Export completed
```

An in-app notification center is the MVP channel; email and push follow. Every
notification is **real** — backed by a DB row, actionable, dismissable, and
never a fake toggle.

---

## 2. Notification types

| Type | Trigger | Action (deep link) | Channels |
|---|---|---|---|
| `generation_finished` | Streaming response completes | Open the chat/message | In-app, (email later) |
| `credits_low` | Usage crosses 20%/10% of plan limit | Open billing/usage | In-app + email |
| `team_invite` | User invited to a project/workspace (8.7) | Accept/decline | In-app + email |
| `knowledge_indexed` | Knowledge file status → READY (8.1) | Open the file | In-app |
| `export_completed` | Export job → DONE (8.6) | Download | In-app |
| `export_failed` | Export job → FAILED | Retry | In-app |
| `mention` | (8.7) User mentioned in comment | Open the thread | In-app + email |
| `subscription` | Billing events (trial end, renewal fail) | Open billing | In-app + email |

---

## 3. User flow

```
Bell icon (TopBar) with unread count badge
    │
    ├── Dropdown panel (recent 20, mark all read)
    ├── Full Notifications page (/notifications): list, filters
    │    ├── Unread / All
    │    ├── Filter by type
    │    └── Mark read / archive all
    ├── Click → navigate to action target + mark read
    └── Settings → per-type toggle + channel preference
```

- Unread badge uses a lightweight subscription (poll or SSE/WebSocket; SSE is
  the MVP — see §5).
- Clicking a notification deep-links to the item and marks it read
  (optimistic).
- Preference defaults: everything on in-app; email off except critical
  (credits_low, subscription).

---

## 4. Architecture

```
Event source (any API/service)
    │  emit(event)
    ▼
NotificationService.create(userId, type, payload)
    │  persists Notification row
    │  dedupe + preferences check
    ▼
Delivery fan-out
    ├── In-app: SSE stream / poll → unread badge + toast
    ├── Email: queue → provider (Resend/Postmark) — later
    └── Push: (later) web push subscription
```

### Event bus (MVP)

- A thin **`NotificationService.emit(type, {userId, payload})`** called
  directly from producing code paths (message route on completion, export job
  on finish, knowledge job on ready).
- No Kafka/broker in MVP — synchronous in-process emit + DB insert is enough
  at this scale. If cross-process emission is ever needed (workers), promote
  to the same in-DB job table used by knowledge/export.

### Dedup & rate limits

- Same event for same user within a window (e.g., generation_finished 30s) is
  coalesced — avoids notification spam during rapid chat use.
- credits_low fires once per threshold crossing per period.

---

## 5. Realtime delivery (MVP: SSE)

- `GET /api/notifications/stream` — Server-Sent Events per user
  (`userId`-scoped, authenticated).
- Client `useNotifications` hook opens an `EventSource`; on `notification`
  events it increments the badge + shows a toast.
- Fallback: 60s poll when SSE unavailable (proxy/browser quirks). Badge always
  reconciles with `GET /api/notifications?unread=1`.

---

## 6. Database changes (design)

```prisma
model Notification {
  id        String    @id @default(cuid())
  userId    String
  type      String    // generation_finished|credits_low|team_invite|knowledge_indexed|export_completed|export_failed|mention|subscription
  title     String
  body      String?
  payload   Json?     // { chatId?, messageId?, exportJobId?, inviteId?, ... }
  read      Boolean   @default(false)
  archived  Boolean   @default(false)
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([userId, createdAt])
  @@index([userId, type])
}

model NotificationPreference {
  id       String  @id @default(cuid())
  userId   String  @unique
  types    Json    @default("{}")   // { generation_finished: true, email: false, ... }
  createdAt DateTime @default(now())
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

`User` gains `notificationEmailEnabled`? — folded into `NotificationPreference`
per-type channel flags instead.

---

## 7. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/notifications?limit=&type=&unread=` | List notifications (paged) |
| GET | `/api/notifications/unread-count` | Badge count |
| POST | `/api/notifications/[id]/read` | Mark one read |
| POST | `/api/notifications/read-all` | Mark all read |
| POST | `/api/notifications/[id]/archive` | Archive one |
| PATCH | `/api/notifications/preferences` | Update per-type + channel prefs |
| GET | `/api/notifications/stream` | SSE stream (auth) |
| POST | `/api/notifications/test` | Dev: emit a sample (flagged) |

`POST /api/notifications/[id]/read` is optimistic client-side; server is the
source of truth for the badge on next fetch.

---

## 8. Frontend architecture

- **`NotificationBell`** — TopBar icon + unread badge (animated dot/pulse).
- **`NotificationDropdown`** — recent 20, mark-read-all, link to full page.
- **`NotificationsPage`** — `/notifications`: full list, type filters,
  archive, empty state.
- **`NotificationItem`** — icon by type, title/body, relative time, unread
  dot, deep-link.
- **`useNotifications` hook** — SSE subscription, badge state, mark-read
  mutations, optimistic UI (mirrors `use-chat` patterns).
- **`NotificationSettings`** — per-type toggles + channel (in-app/email) —
  wired to real `NotificationPreference` (replaces the fake local toggles).

---

## 9. Security

- All queries `userId`-scoped server-side; SSE stream authenticates per
  request and never broadcasts.
- Payloads are internal ids + display strings; client never receives raw
  content beyond what the notification needs (links resolve through normal
  auth).
- Email/push (later) use provider templates; PII exposure minimized.

---

## 10. Future improvements

- Push notifications (Web Push / mobile).
- Email digest (daily/weekly summary).
- Per-item "snooze" and custom actions (Accept invite inline).
- Team-wide notifications with per-member preferences.
- Notification templates/editor for admin.
- Cross-platform sync of read state.
