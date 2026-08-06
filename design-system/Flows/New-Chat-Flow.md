# New Chat Flow

**Entry point:** User in dashboard, clicks "New Chat" or uses ⌘N
**Exit point:** Fresh chat session in `/chat/[chatId]`
**Reference:** Design-System-v1.md §12 (Layout), §10 (AI Interaction)

---

## Flow Diagram

```
User in dashboard
       │
       │ Click "New Chat" (rail, empty state, or ⌘N)
       ▼
  ┌──────────────────┐
  │ 1. Create chat   │
  │ POST /api/chats  │
  │ → returns chat   │
  │   with id        │
  │                  │
  │ 2. Navigate      │
  │ → /chat/[chatId] │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 3. Chat page     │
  │    loads with:   │
  │    - Empty thread │
  │    - Composer     │
  │    - Tone bar     │
  │    - Sidebar open │
  │    - Context:     │
  │      closed       │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 4. Composer      │
  │    "Message      │
  │     ToneCraft..."│
  │                  │
  │    User types... │
  │                  │
  │    [Send]         │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 5. AI processes  │
  │    - Thinking    │
  │      indicator   │
  │    - Streaming   │
  │      underline   │
  │    - Message     │
  │      appears     │
  └──────────────────┘
```

---

## Step-by-Step

### Step 1: Trigger

**Trigger sources:**
1. NavigationRail "Compose" item (always visible on desktop)
2. Empty state "New Chat" button
3. Keyboard shortcut: ⌘N
4. Chat index page (no active conversation)

**Behavior:**
- Calls `POST /api/chats` with optional title
- API returns `{ id, title, createdAt }`
- Immediately routes to `/chat/{id}`

**UI Feedback:**
- Button shows spinner briefly
- No modal confirmation (direct action)

---

### Step 2: Navigation

**Transition:** Route change to `/chat/[chatId]`
**Layout:** ComposeWorkspace takes over
- Left pane: ConversationSidebar (shows new chat in list)
- Center: ChatPage component
- Right: Context drawer (closed)

**Loading state:**
- Chat header shows skeleton title
- Message area shows empty state: "Start a conversation"

---

### Step 3: Chat Page Mount

**What renders:**
- ChatHeader: conversation title + [Export][Share] actions
- MessageList: empty (shows empty state)
- Composer: "Message ToneCraft..." placeholder
- ToneBar: shows current tone chip
- Context drawer: closed

**Data fetch:**
- `GET /api/chats/{chatId}` — fetches chat + messages
- ConversationSidebar fetches recent chats

---

### Step 4: Composer Interaction

**Default state:**
- Tone bar visible with current default tone
- Composer placeholder: "Message ToneCraft..."
- Send button disabled (empty input)

**User types message:**
- Textarea auto-expands up to 240px max height
- Send button enables when text is non-empty
- Tone bar remains visible

---

### Step 5: Send Message

**On click "Send" or Enter:**
1. User message appears immediately in message list
2. Composer clears, Send button disables
3. AIThinking indicator (3-dot pulse) appears below composer
4. `POST /api/chats/{chatId}/messages` with SSE stream
5. Streaming content appears in AI message bubble
6. Animated underline on AI message
7. When stream ends, AIThinking disappears
8. Send button re-enables

**AI States during flow:**
- `idle` → `thinking` → `streaming` → `finished`

---

### Edge Cases

| Scenario | Handling |
|----------|----------|
| API error | Show error in message bubble with retry |
| Network drop | Show offline indicator, queue message |
| Stream interrupted | Show partial content, offer regenerate |
| Empty input | Send button stays disabled |
| New chat while another open | Old chat stays in sidebar, new one gets focus |
