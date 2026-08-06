# AI Generation Flow

**Entry point:** User sends a message (click Send or Enter)
**Exit point:** Complete AI response rendered
**Reference:** Design-System-v1.md §10 (AI Interaction), §8 (Motion)

---

## Flow Diagram

```
User sends message
       │
       ▼
  ┌──────────────────┐
  │ 1. Message sent  │
  │    - User msg    │
  │      appears     │
  │    - Composer    │
  │      disabled    │
  │    - Stop button │
  │      appears     │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 2. Thinking state │
  │    - AIThinking   │
  │      3-dot pulse │
  │    - GradientPulse│
  │      in composer │
  │    - Tone bar    │
  │      shows tone  │
  └──────────────────┘
       │
       ▼  (server responds)
  ┌──────────────────┐
  │ 3. Streaming    │
  │    - Empty AI    │
  │      bubble      │
  │    - Animated    │
  │      underline   │
  │    - Text grows  │
  │      token by   │
  │      token       │
  │    - Scroll to   │
  │      bottom      │
  └──────────────────┘
       │
       ▼  (stream ends)
  ┌──────────────────┐
  │ 4. Finished     │
  │    - Underline  │
  │      removed    │
  │    - Glow pulse │
  │      (300ms)    │
  │    - Elevation  │
  │      returns     │
  │    - Actions:   │
  │      Copy,      │
  │      Regenerate,│
  │      Like,      │
  │      Dislike    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 5. Composer     │
  │    re-enabled    │
  │    - Stop btn →  │
  │      Send btn    │
  └──────────────────┘
```

---

## AI States

### State 1: Idle
- **Duration:** Before user sends message
- **Visual:** Composer ready, Send button enabled
- **No indicator visible**

### State 2: Thinking
- **Duration:** Variable (typically 0.5–2s)
- **Visual:** 
  - AIThinking 3-dot pulse indicator below composer
  - GradientPulse animation (tone-color glow)
  - Tone bar remains visible showing current tone
- **User can:** Cancel (stop button appears)

### State 3: Streaming
- **Duration:** Variable (depends on response length)
- **Visual:**
  - AI message bubble appears immediately (empty)
  - Animated underline (0→100% width) under streaming text
  - Text grows line-by-line with 30ms stagger
  - Slightly transparent background (`bg-card/80`)
  - Auto-scroll to bottom (if user is near bottom)
- **User can:** Cancel (stop button)

### State 4: Finished
- **Duration:** Permanent until next action
- **Visual:**
  - Underline removed
  - Background opacity returns to 100%
  - `elevation-2` shadow applies
  - Brief glow pulse (300ms) on last message
  - Inline actions appear (Copy, Regenerate on hover/focus)

### State 5: Error
- **Trigger:** API failure, network error, model error
- **Visual:**
  - AI bubble with red border-left (`semantic-error`)
  - Error message text
  - "Retry" and "Regenerate" buttons inline
- **User can:** Retry or Regenerate

---

## Streaming Mechanics

### Server-Sent Events (SSE)
1. Client opens `POST /api/chats/{chatId}/messages` with `text/event-stream`
2. Server sends tokens as SSE `data` events
3. Client accumulates and renders tokens progressively

### Scroll Management
- Message arrives → jump to bottom
- Tokens stream → stay pinned only if near bottom (within 80px)
- Per-token scroll writes coalesced via `requestAnimationFrame` (prevents layout thrash)
- Scroll-to-bottom floating button appears if user scrolls up

---

## Tone Adaptation

During the entire flow, the UI maintains visual consistency with the selected tone:
- Tone chip in composer shows active tone with color
- AI message border-left matches tone accent
- Streaming underline color matches tone
- If tone changes mid-conversation, new messages use new tone color

---

## User Actions During/After Generation

| Action | Available When | Result |
|--------|---------------|--------|
| Copy | After finished | Copies message markdown to clipboard |
| Regenerate | After finished | Deletes current + generates new |
| Like | After finished | Records positive feedback |
| Dislike | After finished | Records negative feedback |
| Stop | During thinking/streaming | Cancels current generation |
| Continue | After finished | Appends and continues generation |
