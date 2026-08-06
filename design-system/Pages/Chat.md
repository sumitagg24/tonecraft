# Chat Page Specification

**Route:** `/chat/[chatId]` (`src/app/(dashboard)/chat/[chatId]/page.tsx`)
**Layout:** ComposeWorkspace (three-pane: sidebar + center + context drawer)
**Reference:** Design-System-v1.md §10 (AI Interaction), §12 (Layout)

---

## Purpose

The core writing interface. Displays conversation history between user and AI, with a composer at the bottom for sending new messages. Shows AI processing states (thinking, streaming) in real-time.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ ComposeWorkspace (three-pane)                                      │
├──────┬──────────────────────────────────────────────────────────────┤
│      │  Chat Header (12-row height, fixed)                        │
│ Left │  ┌──────────────────────────────────────────────────────┐  │
│ Pane │  │  Conversation Title                [Export][Share]   │  │
│ (280 │  └──────────────────────────────────────────────────────┘  │
│ px)  │                                                              │
│      │  Message List (scrollable, flex-1)                           │
│      │  ┌──────────────┐                                         │
│      │  │ User message │  ┌─ tone accent border-left ─┐          │
│      │  ├──────────────┤  │                                    │
│      │  │ AI message    │  │  Streaming: animated underline     │
│      │  │ (thinking...) │  │  Finished: elevation-2 shadow      │
│      │  └──────────────┘  └────────────────────────────────────┘  │
│      │                                                              │
│      │  AI Thinking indicator (3-dot pulse)                         │
│      │  GradientPulse (subtle tone-color pulse)                     │
│      │                                                              │
│      │  [Scroll to bottom button] (floating, bottom-right)         │
│      ├──────────────────────────────────────────────────────────────┤ │
│      │  Tone Bar (inline above composer)                         │
│      │  Composer (min-h-44, max-h-240)                           │
│      │  ┌──────────────────────────────────────────────────────┐  │
│      │  │ [tone chip] [content...] [send/stop button]         │  │
│      │  └──────────────────────────────────────────────────────┘  │
├──────┴──────────────────────────────────────────────────────────────┤
│ Right Pane: Context Drawer (320px, overlay on desktop)              │
│  - Tone selector                                                     │
│  - Model selector                                                     │
│  - Knowledge attachments                                             │
│  - Persona selector                                                    │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `PremiumMessageCard` | `src/components/workspace/PremiumMessageCard.tsx` | Renders user and AI messages |
| `PremiumComposer` | `src/components/workspace/PremiumComposer.tsx` | Input area, tone bar, send/stop |
| `AIThinking` | `src/components/workspace/AIThinking.tsx` | 3-dot pulse indicator |
| `GradientPulse` | `src/components/workspace/AIThinking.tsx` | Tone-color pulse animation |
| `InlineActionRing` | `src/components/workspace/InlineActionRing.tsx` | Message actions (copy, regenerate) |
| `ExportMenu` | `src/components/workspace/ExportMenu.tsx` | Export/share dropdown |
| `SocialButton` | `src/components/ui/effects/SocialButton.tsx` | Share to social platforms |
| `ConversationSidebar` | `src/components/workspace/ConversationSidebar.tsx` | Left pane conversation list |
| `AIContextPanel` | `src/components/workspace/AIContextPanel.tsx` | Right pane context drawer |

---

## AI States

| State | Visual Behavior |
|-------|-----------------|
| Idle | No indicator |
| Thinking | 3-dot pulse in composer area + GradientPulse |
| Streaming | Message bubble appears immediately with animated underline |
| Finished | Brief glow pulse (300ms) |
| Error | Red border-left, retry button inline |

---

## Data Requirements

- Route param: `chatId`
- `GET /api/chats/{chatId}` — fetches chat + messages
- `POST /api/chats/{chatId}/messages` — sends new message (SSE stream)
- `POST /api/chats/{chatId}/regenerate` — regenerates a message
- `POST /api/chats/{chatId}/continue` — continues a message
- WebSocket/SSE for streaming responses

---

## Interaction Notes

- **Smart auto-scroll**: Jumps to bottom when a new message arrives; stays pinned during streaming only if user is already near bottom
- **Per-token scroll coalescing**: Uses requestAnimationFrame to batch scroll writes, avoiding layout thrash
- **Inline actions**: Copy, Regenerate visible on hover/focus (touch targets ≥ 44px)
- **Scroll-to-bottom button**: Floating button appears when not at bottom
- **Context drawer**: Opens right-to-left slide animation (320px desktop, bottom sheet mobile)
- **Escape key**: Closes context drawer and mobile overlays
- **Share**: Copies chat link or opens native share dialog

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Left sidebar → slide-over drawer, context → bottom sheet (70vh), composer full-width |
| Desktop (≥768px) | Three-pane fixed layout, context as overlay drawer |
| Focus Mode | Hides sidebar and context panel, centers content at `max-w-3xl` |
| Writer Mode | Minimal chrome, content at `max-w-2xl` centered |

---

## Workspace Modes

| Mode | Sidebar | Context | Content Width | Use Case |
|------|---------|---------|---------------|----------|
| **chat** | Visible | Drawer available | Full width | Default working mode |
| **focus** | Hidden | Hidden | Max-w-3xl centered | Deep writing |
| **writer** | Hidden | Hidden | Max-w-2xl centered, minimal chrome | Long-form writing |
| **compact** | Hidden | Visible | Full width | Reference context |
| **minimal** | Hidden | Hidden | Full width | Distraction-free |

---

## Design Tokens Used

- `radius-2xl` for message bubbles (asymmetric rounding)
- `elevation-2` for AI messages, `elevation-glow` for streaming
- `space-y-4` (16px) between messages
- `semantic-accent` for tone-specific borders
- `caption` for timestamps (12px)
- `duration` / `ease` motion tokens for transitions
