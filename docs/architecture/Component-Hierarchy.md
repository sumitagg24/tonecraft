# Component Hierarchy

> Mapping every screen to its components so implementation is mechanical. Tier
> rules come from `docs/design/Component-Guidelines.md`; layout decisions from
> `Workspace-Architecture.md`.

## 1. The shell

```
DashboardLayout (app/(dashboard)/layout.tsx)
└─ AppShell                 ← replaces WorkspaceLayout as the global wrapper
   ├─ GlobalRail            ← NEW: 5 destinations, ⌘K, ⌘N
   ├─ SectionSlot           ← renders the active section's content
   ├─ CommandPalette        ← unchanged (layout/CommandPalette.tsx)
   └─ PremiumCursor         ← unchanged
MobileTabBar                ← NEW: bottom tab bar (< md breakpoint)
```

`AppShell` owns: rail state, section routing, keyboard shortcuts (⌘K, ⌘N, ⌘1–4,
⌘⇧S). It does **not** own pane open/close state — that stays in
`workspace-store.ts` per section.

## 2. Compose section

```
ComposeSection
├─ SectionHeader          ← breadcrumb, conversation title, thread actions
├─ ConversationSidebar    ← refactor: drop quick-action row; keep groups/context menu
│  └─ ChatItem            ← unchanged
├─ ThreadView
│  ├─ ChatList            ← unchanged
│  ├─ PremiumMessageCard / ChatMessage ← unchanged
│  ├─ InlineActionRing    ← unchanged
│  ├─ AIThinking          ← unchanged (gated by reduced motion)
│  └─ PremiumComposer     ← unchanged
│     ├─ SmartSuggestions
│     └─ tone bar
└─ ContextDrawer          ← NEW: merged from AIContextPanel + ContextPanel
   └─ KnowledgeAttach     ← NEW: attach knowledge to this conversation
```

## 3. Tools section

```
ToolsSection
├─ ToolHeader             ← search + category pills (from tools/page)
├─ ToolGrid               ← ToolCard (unchanged)
└─ ToolPanel              ← unchanged, opens inline in center pane
```

## 4. Library section

```
LibrarySection
├─ LibraryTabs            ← NEW: Prompts / Tones / Knowledge
├─ PromptList             ← NEW: reuse PromptLibrary.tsx data + add save/use
│  └─ PromptDetail        ← inline detail + "Use in Compose"
├─ ToneList               ← NEW: personas moved from Settings
│  └─ ToneEditor          ← NEW: create/edit a tone (reuse composer affordances)
└─ KnowledgeList          ← NEW: over existing /api/upload + storage counters
   └─ KnowledgeDetail     ← inline detail + "Attach to conversation"
```

## 5. Search section

```
SearchSection
├─ SearchScopes           ← NEW: All / Conversations / Messages / Prompts / Tones / Knowledge
└─ SearchResults          ← reuse use-search.ts + results list from search/page
   └─ ResultRow           ← deep-links to the exact asset
```

## 6. Account section

```
AccountSection
├─ AccountTabs            ← NEW: Profile / Appearance / Notifications / Billing / Usage / Danger
├─ ProfileTab             ← from settings/page (profile card)
├─ AppearanceTab          ← from settings/page (theme) → /api/preferences
├─ NotificationsTab       ← from settings/page (toggles; wire to real intent or label "soon")
├─ BillingTab             ← from billing/page minus usage meters
├─ UsageTab               ← NEW: extract meters from billing/page → /api/usage
└─ DangerTab              ← from settings/page (delete account) → /api/user/delete
```

## 7. Shared & primitives (unchanged)

- `ui/*` — button, input, card, tabs, switch, dialog, dropdown-menu, select,
  tooltip, scroll-area, badge, slider (Radix/shadcn). New surfaces reuse these.
- `ui/recipes/*` + `src/styles/recipes.ts` — PremiumCard/Panel/Badge.
- `shared/` — `EmptyState`, `WorkspaceEmptyStates`, `PageSkeleton`, `Suspense*`,
  `ErrorBoundary`/`ErrorFallback`.
- `layout/CommandPalette.tsx` — stays; content trimmed to navigation/actions.

## 8. Component ownership rules

1. A component lives under the section that owns it (`components/workspace`,
   `components/tools`, `components/landing`, `components/chat`). Nothing renders
   two sections' internals.
2. Cross-section bridges are props/handlers, not imports (e.g. "send to
   conversation" passes a draft up from `ToolPanel` to the Compose store).
3. No component renders a raw destination list that duplicates the rail. Rail
   items exist in one place: `GlobalRail`.
4. New components start from the primitives + recipes in `docs/design/`; no
   forked class strings.
