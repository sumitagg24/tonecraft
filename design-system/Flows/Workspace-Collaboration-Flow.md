# Workspace Collaboration Flow

**Entry point:** User shares a chat or is invited to a workspace
**Exit point:** User collaborates on shared chat/content
**Reference:** Design-System-v1.md §12 (Layout)

---

## Flow Diagram

```
User has a chat
       │
       │ Click "Share" in ChatHeader
       ▼
  ┌──────────────────┐
  │ 1. Share dialog  │
  │    [Copy link]   │
  │    [Twitter]     │
  │    [LinkedIn]    │
  │    [Invite... ]   │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 2. Link copied   │
  │    or invited    │
  │                  │
  │    Other user    │
  │    opens link    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 3. View shared   │
  │    chat          │
  │    - Read-only   │
  │      by default  │
  │    - [Comment]   │
  │    - [@Mention]  │
  │    - [Fork]      │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 4. Interaction  │
  │    - Add comment │
  │    - Mention     │
  │    - Fork to own │
  │      workspace   │
  └──────────────────┘
```

---

## Step-by-Step

### Step 1: Share Dialog

**Trigger:** Click "Share" button in ChatHeader

**Dialog content:**
```
┌──────────────────────────────┐
│ Share                        │
│ ──────────────────────────── │
│                              │
│ [Copy Link]                  │
│                              │
│ Share to social:             │
│ [Twitter] [LinkedIn] [Copy]  │
│                              │
│ Invite person:               │
│ [Email input ______] [Send]  │
└──────────────────────────────┘
```

**Behavior:**
- "Copy Link" writes `/chat/{chatId}` to clipboard, shows toast
- Social buttons open share dialog (browser native or custom URL)
- Invite: sends email via notifications API

---

### Step 2: Access Shared Chat

**Scenarios:**
1. **Unauthenticated visitor:** Can view shared chat, can sign up to interact
2. **Authenticated visitor:** Can view, comment, fork
3. **Original owner:** Full edit access

**Route:** `/chat/{chatId}` (same as own chat, but in read-only mode)

**Read-only mode:**
- Composer hidden
- Messages display normally
- Inline actions limited (Copy, Regenerate disabled for non-owners)
- Comment mode available on each message

---

### Step 3: Comment Mode

**Trigger:** Click "Comment" on a message (viewer/collaborator)

**Features:**
- Comment thread attaches to specific message
- `@mention` to notify someone (`@email` or `@userId`)
- Reply chain within comment
- Inline with message (don't disrupt chat flow)

**Data:**
- `POST /api/comments` — create comment
- `GET /api/comments?messageId=X` — list comments
- SSE for real-time comment updates

---

### Step 4: Fork to Workspace

**Trigger:** "Fork" button (top-right of shared chat)

**Behavior:**
- Creates a copy of the chat in user's workspace
- Routes to `/chat/{newChatId}`
- Original remains unchanged
- Fork attribution shown in metadata

**API:**
- `POST /api/chats/{chatId}/fork` → returns new chat object

---

## Real-Time Updates

### WebSocket/SSE Events
- `message:new` — new message added
- `message:updated` — message edited
- `comment:new` — new comment on any message
- `comment:mention` — user mentioned in comment

### UI Updates
- New messages fade in from message list
- Comments appear in real-time without refresh
- Mention notifications show toast with click-to-jump

---

## Permissions

| Role | Can View | Can Comment | Can Edit | Can Delete |
|------|----------|-------------|----------|------------|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✗ |
| Commenter | ✓ | ✓ | ✗ | ✗ |
| Viewer | ✓ | ✗ | ✗ | ✗ |

---

## Notifications

| Event | Trigger | Recipient | Type |
|-------|---------|-----------|------|
| New comment | Comment added | Chat owner | `comment` |
| Mention | `@username` | Mentioned user | `mention` |
| Reply | Reply to comment | Comment author | `comment` |
| Fork | Chat forked | Original owner | `fork` |

All delivered via notification SSE stream + email if enabled.
