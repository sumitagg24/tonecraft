# Workspace Layout Specification

**Layout Component:** `ComposeWorkspace` (`src/components/workspace/ComposeWorkspace.tsx`)
**Routes:** All routes under `/(dashboard)/chat/*`
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

The three-pane workspace layout that wraps all Chat routes. Manages the conversation sidebar, center content area, and context drawer. Handles workspace modes (chat, focus, writer, compact, minimal) and responsive behavior across mobile/desktop.

This is a **layout**, not a page — it provides the structural container that individual page components (like ChatPage) render inside.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ ComposeWorkspace                                                   │
├──────┬──────────────────────────────────────────────────────────────┤
│      │                                                             │
│ Left │  ProjectSidebar (optional)                                 │
│ Pane │  ConversationSidebar (pinned/recent/favorites)              │
│ (280 │                                                             │
│ px)  │  ┌──────────────────────────────────────────────────────┐  │
│      │  │ Mode Switcher [C][F][W][S][M]                        │  │
│      │  │ [≡ sidebar toggle] [context toggle]                  │  │
│      │  └──────────────────────────────────────────────────────┘  │
│      │                                                             │
│      │  Page Content (children)                                    │
│      │  ────────────────────────────────────────────────────────   │
│      │                                                             │
│      │  ChatHeader (conversation title + actions)                  │
│      │  MessageList (scrollable)                                   │
│      │  Composer (tone bar + input)                                │
│      └──────────────────────────────────────────────────────────────┘ │
├──────┴──────────────────────────────────────────────────────────────┤
│ Right Pane: Context Drawer (320px)                                  │
│  - Tone selector                                                   │
│  - Model selector                                                  │
│  - Knowledge attachments                                           │
│  - Persona selector                                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `ComposeWorkspace` | `src/components/workspace/ComposeWorkspace.tsx` | Root layout wrapper |
| `ProjectSidebar` | `src/components/workspace/ProjectSidebar.tsx` | Project-level navigation |
| `ConversationSidebar` | `src/components/workspace/ConversationSidebar.tsx` | Chat list with groups |
| `AIContextPanel` | `src/components/workspace/AIContextPanel.tsx` | Tone/model/knowledge context |
| `ModeSwitcher` | Inline in ComposeWorkspace | Button group: Chat, Focus, Writer, Compact, Minimal |

---

## Workspace Modes

| Mode | Sidebar | Context | Content Width | Mode Badge |
|------|---------|---------|---------------|------------|
| **chat** | Visible (280px) | Overlay drawer (320px) | Full width | None |
| **focus** | Hidden | Hidden | `max-w-3xl` centered | "Focus Mode" |
| **writer** | Hidden | Hidden | `max-w-2xl` centered | "Writer Mode" |
| **compact** | Hidden | Visible (inline) | Full width | None |
| **minimal** | Hidden | Hidden | Full width | None |

Mode switcher appears only in non-focus/writer modes.

---

## Layout Dimensions

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | 280px fixed | Slide-over drawer (85vw max) |
| Context | 320px overlay | Bottom sheet (70vh) |
| Content min-width | flex-1 | flex-1 |
| Header height | 48px | 48px |

---

## Interaction Rules

1. **Mode changes**: Focus/Writing modes hide sidebar and context; Compact opens context inline; Standard/Chat shows both as drawers
2. **Keyboard shortcuts**:
   - `⌘B` — toggle sidebar (mobile: toggle drawer)
   - `⌘\` — toggle context panel (mobile: toggle bottom sheet)
   - `Escape` — close mobile overlays
3. **Auto-close**: Mobile overlays close on route change
4. **Smart scroll**: Per-frame coalescing prevents layout thrash during streaming
5. **Mode indicator**: "Focus Mode" / "Writer Mode" badge appears at top center in those modes
6. **Reduced motion**: All transitions respect `prefers-reduced-motion`

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Sidebar → slide-over drawer from left, Context → bottom sheet from bottom, Mode switcher hidden |
| Desktop (≥768px) | Sidebar → fixed 280px pane, Context → right overlay drawer (320px), Mode switcher visible |

---

## Data Requirements

- Workspace mode and panel visibility stored in `src/stores/workspace-store.ts` (Zustand)
- No API calls — this is a pure layout component

---

## Design Tokens Used

- `SIDEBAR_WIDTH` = 280px (from spacing scale)
- `CONTEXT_WIDTH` = 320px (from spacing scale)
- `duration.normal` (350ms) for pane transitions
- `duration.fast` (200ms) for overlay fade
- `spring` easing for mobile drawer animations
- `border-border/20`, `border-border/30` for pane dividers
