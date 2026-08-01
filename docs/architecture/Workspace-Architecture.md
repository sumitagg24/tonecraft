# Workspace Architecture

> The layout of the work surface and each section's pane, finalized before UI.
> Current code reference: `WorkspaceLayout.tsx` (three fixed panes), five-mode
> switcher, ⌘⇧F overlay. All of this is redesigned here — on paper first.

## 1. The compose pane (the product)

```
┌──────────┬──────────────────────────────────────────┬──────────────┐
│ GLOBAL   │  SECTION HEADER (breadcrumb · actions)   │              │
│ RAIL     ├──────────────────────────────────────────┤              │
│          │                                          │              │
│ Compose  │  THREAD                                 │  AI CONTEXT  │
│ Tools    │   message                              │  (drawer)    │
│ Library  │   message                              │  tone · model│
│ Search   │   …                                    │  knowledge   │
│ Account  │  ─────────────────────────────────────  │  summary     │
│          │  COMPOSER                               │              │
│          │  [tone bar]  [input]  [send]            │              │
└──────────┴──────────────────────────────────────────┴──────────────┘
```

- **Left (section nav, inside Compose):** conversation list — Pinned, Favorites,
  Today/Yesterday/This Week/Older. This is Compose's *sub-navigation*, not the
  app navigation. A "Manage" toggle expands it into a browsable index (filters:
  archived, tone; bulk archive/delete; title search).
- **Center:** the thread + composer. The composer's **tone bar is the product's
  defining control** — one interaction from the cursor, always.
- **Right:** context drawer — current tone, model, attached knowledge, summary.
  This is the *only* home of the "attach knowledge" action (open drawer →
  attach). It is a drawer (overlay), not a third permanent pane.
- **Top:** per-section header, not a global nav. Carries the Compose name,
  conversation title, and thread actions (share, export).

### Decision: three panes → two panes + drawer

Current `WorkspaceLayout` renders three simultaneous fixed panes (280px sidebar
+ content + 320px context). The context panel is **changed from a permanent pane
to a drawer** so it stops competing with content width; the conversation sidebar
remains a pane because it is Compose's sub-nav. On mobile both become overlays
(`User-Flows.md` §7).

## 2. Workspace modes: six → three

The store defines `chat | focus | writer | split | compact | minimal`. The
switcher shows five. These overlap and confuse. **Decision: three density
modes**, each changing *chrome only*, never content or routes:

| Mode | What it does |
|---|---|
| **Standard** (was `chat`) | Full layout: sidebar pane + content + context drawer available. |
| **Focus** (was `focus`) | Hides sidebar and context; centered max-w-3xl column; hides section header controls except minimal exit. |
| **Writer** (was `writer`) | Same as Focus but minimal chrome (no hint labels, hidden composer chrome) for long-form writing. |

Removed: `compact` (equivalent to Standard with sidebar closed), `minimal`
(redundant with Writer), `split` (never surfaced). The switcher is a compact
segmented control in the section header — **it is not a navigation item**.

## 3. Tools pane

- Category pills → grid of tool cards.
- **A tool opens inline in the center pane** (the current `/tools` page already
  does this with `ToolPanel`; it stays inline, no URL change, no dead-ends).
- Tool panel: input, applied tone (defaults to the account default, overridable),
  output, and **"send to conversation"** — the single bridge between Capability
  and Work. It drops the result into the current Compose thread as a draft.
- `Escape` or the grid's close affordance returns to the catalog.

## 4. Library pane

- Sub-nav: **Prompts / Tones / Knowledge**. Each tab is a list + inline detail;
  nothing opens as a separate page.
- **Prompts**: curated templates (the orphaned `PromptLibrary` data) + saved
  prompts. "Use" → opens Compose preloaded with the prompt and the tone. Two
  clicks from idea to writing.
- **Tones**: built-in tones + custom personas (moved here from Settings). The
  composer tone bar reads from this tab. Creating/editing a tone is a writing
  act, not a settings chore.
- **Knowledge**: uploaded reference documents (upload API + storage counters
  already exist — this is the missing surface). Files attach to a conversation
  from the context drawer, or to a custom tone, to ground tone and content.

## 5. Search pane

- Scope tabs: All / Conversations / Messages / Prompts / Tones / Knowledge.
- Results deep-link to the exact asset. Message results scroll the conversation
  to the match.
- This is the *only* full-text surface. The overlay is removed; ⌘K remains
  navigation-only (`Navigation-Map.md` §4).

## 6. Account pane

- Left sub-nav: Profile · Appearance · Notifications · Billing · Usage ·
  Danger Zone.
- Personas **leave** this section (→ Library → Tones).
- Billing and Usage are **split**: Billing holds plan + upgrade + manage
  subscription; Usage holds message/token/upload/storage meters. Usage is one
  click from Billing and cross-referenced in Compose when a limit approaches.

## 7. Empty states are the tutorial

Every section's empty state states one primary next action and links into
Compose: Knowledge empty → "Upload a reference document" → then offers "Attach
it to a conversation." The current `WorkspaceEmptyStates` and `EmptyState`
components are reused, restated to lead into Compose.

## 8. Workspace components (current → target)

| Current | Target role |
|---|---|
| `WorkspaceLayout.tsx` | becomes the AppShell wrapper (rail + section slot); pane logic moves to a `ComposeSection` |
| `ConversationSidebar.tsx` | Compose section nav; drop the quick-action row (rail replaces it) |
| `AIContextPanel.tsx` / `ContextPanel.tsx` | one context *drawer* (merge the two) |
| `UniversalSearch.tsx` | removed; `/search` absorbs |
| `PremiumComposer`, `PremiumMessageCard`, `ChatList`, `ChatInput`, `InlineActionRing`, `SmartSuggestions`, `AIThinking` | unchanged, live inside Compose thread |
| `CommandPalette.tsx` | unchanged (navigation/actions only) |
| `PromptLibrary.tsx` | wired into Library → Prompts |
| `TopNavigation.tsx` | replaced by the per-section header |

Full component mapping: `Component-Hierarchy.md`.
