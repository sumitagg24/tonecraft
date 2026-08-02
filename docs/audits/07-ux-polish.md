# UX Polish Audit — 07

Date: 2026-08-02 · Scope: every screen in `src/app` + shared workspace/shell components. Read-only; nothing modified.
Method: component review of the shell (TopBar, NavigationRail, MobileBottomBar, NotificationCenter), workspace (ComposeWorkspace, ConversationSidebar, pickers, composer, message cards, library pages), landing, and settings/billing/search/tools. This is a *consistency* audit — it hunts small inconsistencies, not functional bugs (those live in audits 04/05).

**Note:** static review only; several items are visual and should be confirmed in a live browser (Chrome is available for a follow-up run).

Ranked by impact (higher = more user-visible):

- **P1: 4** — five different modal implementations; empty-state fragmentation; loading-state fragmentation; font-size drift below 10px.
- **P2: 6** — touch targets, hover-opacity drift, animation-token drift, icon-size drift, scrollbar styling, duplicate page headings.
- **P3: 5** — kbd hint styles, card padding variance, badge clipping, settings section rhythm, stale/non-functional chrome.

---

## P1

### P1-1. Five different "modal/overlay" implementations — pick one primitive

The same interaction (a focused, dismissable overlay) is implemented five different ways:

1. **Custom `fixed inset-0 z-50` divs, no dialog semantics** — `PromptEditor`/`PromptRunDialog` (`PromptLibraryPage.tsx:346-426, 473-537`), `PersonasLibraryPage` create/edit modals.
2. **Anchored popover** — `NotificationCenter` (w-80 panel), `ExportMenu` (w-64 panel), both with a `fixed inset-0` backdrop + `motion.div` panel.
3. **Centered overlay** — `CommandPalette`.
4. **Sheet-style panel** — `ToolPanel`.
5. **Bottom sheet on mobile** — `PickerSurface` (intentionally different, good).

Radix `dialog.tsx`/`sheet.tsx` primitives are installed but **unused** (also flagged as "dead" in audit 01 — they're unused precisely because hand-rolled modals took their place). The visible differences: backdrop opacity/color, panel radius (`rounded-xl` vs `rounded-lg` vs `rounded-2xl`), padding (`p-4` vs `p-6`), transition durations, and focus behavior (audit 04 M3/M4).

Fix: build one `Modal`/`Sheet` primitive on Radix (inherits focus trap + Escape + `aria-modal` for free — closes audit-04 M3/M4) and migrate the 5 implementations to it. Highest-leverage consistency fix in the app.

### P1-2. Empty states are fragmented

Four distinct renderings of "nothing here":
- Componentized: `WorkspaceEmptyStates` (NoConversation/NoChats/NoSearch/NoFavorites/…)
- Inline text: "No notifications yet" (NotificationCenter), "No tools match" (ToolPicker), "No documents yet" (KnowledgeLibraryPage), "No personas yet" (PersonasLibraryPage)
- Failed-load-as-empty: `.catch(() => setLoading(false))` shows the empty state on API failure (audit 05 P0-6) — a user cannot tell "empty" from "broken"
- Missing entirely: chat sidebar renders nothing while loading (audit 05 P1-6)

Fix: one `<EmptyState icon title description action?>` used everywhere, plus an `error` variant ("Failed to load — retry") so failures stop masquerading as emptiness.

### P1-3. Loading states are inconsistent

- Route-level: `PageSkeleton` skeletons in `loading.tsx` (good)
- In-page fetches: spinner-only (`settings`, `billing`, `search`), skeleton (chat page), nothing (sidebar, pickers, context panel)
- Button-level: `Loader2 animate-spin` on some submit buttons, no disabled/loading state on others
- Spinners are mostly unlabeled (audit 04 m4: no `role="status"`)

Fix: a small `Loading` taxonomy — skeletons for content regions, inline spinner for buttons, `role="status"` everywhere — and apply it consistently across the ~10 fetch sites.

### P1-4. Font size drifts below legibility tokens

Arbitrary micro-sizes are scattered where the design system should speak:
- `text-[9px]` — notification timestamps (NotificationCenter), sidebar timestamps
- `text-[10px]` — chips (ToolPicker CategoryChip), kbd hints, action labels
- `text-[11px]` — description text in pickers and notification bodies

These are also contrast risks (audit 04 m2). Fix: add `text-tiny`/`text-micro` tokens to `src/styles/typography.ts` and replace the arbitrary values; keep 9–10px only for decorative, non-essential metadata.

---

## P2

### P2-1. Touch targets below 44px (WCAG 2.5.8 — cross-ref audit 04 m1)

- TopBar/NavigationRail icon buttons `h-8 w-8`
- CategoryChip `h-6`, PersonaPicker stars `h-6 w-6`, message action buttons `sm:h-7 sm:w-7`, sidebar more-button `h-7 w-7`, NotificationCenter actions `h-6`
- Fix: ≥44px (or ≥24px with 8px spacing). One utility (`min-h-11 min-w-11` on icon buttons) covers most.

### P2-2. Hover/active color opacity drift

Same "hoverable row" uses `hover:bg-muted/20` (NotificationCenter), `/30` (TopBar, ToolPicker), `/50` (CategoryChip) across components. Fix: add a `rowHover`/`iconButton` recipe to `src/styles/recipes.ts` (the file exists but only `recipe.badge` is consumed) and use it for all list rows and icon buttons.

### P2-3. Animation duration drift

`duration.normal`/`spring.snappy` (chat page, command palette) vs hardcoded `0.12s`/`0.15s`/`0.2s` literals (NotificationCenter, ExportMenu, PromptLibraryPage modals). Motion tokens exist (`src/styles/motion.ts`) — use them so easing/duration can be tuned globally and respected by reduced-motion.

### P2-4. Icon-size drift

Icon buttons mix `w-4 h-4` (TopBar, notification rows) and `w-3.5 h-3.5` (tool rows, panel headers) for the same visual weight; inline "chip" icons use `w-3`. Pick a 3-size scale (16px primary / 14px secondary / 12px inline) and stick to it.

### P2-5. Scrollbar styling inconsistency

Custom `scrollbar-thin` and `scrollbar-none` utilities in some lists (chat scroll, pickers, NotificationCenter) and the native scrollbar elsewhere (settings, library pages). Decide: apply `scrollbar-thin` globally via a base-layer utility so lists match.

### P2-6. Duplicate page `h1`s

`TopBar` renders an `<h1>` for every dashboard page, and several pages render their own `<h1>` (search, billing, Prompt/Personas/Knowledge libraries) — two h1s per page (audit 04 m13). Fix: TopBar title becomes `<p>`/`<h2>`, or drop the in-page h1s.

---

## P3

### P3-1. kbd/command-hint styling varies

`CommandPalette` footer hints and the TopBar `⌘K` chip use different kbd treatments (`text-[10px] font-mono text-muted-foreground/50` vs footer `text-xs`). Standardize on one `Kbd` style.

### P3-2. Card/row padding variance

Cards and rows mix `p-4`, `p-5`, `px-3 py-2.5`, `px-4 py-3` for the same content density (notification rows `px-3 py-2.5`, conversation rows `px-2 py-2`, settings cards `p-4`, library cards `p-4` vs `p-5`). Pick a 3-step spacing scale and apply per surface type (card / row / compact-row).

### P3-3. Notification badge clipping risk

The unread badge sits at `-top-0.5 -right-0.5` on a `h-8 w-8` button — verify it doesn't clip under the TopBar edge or overlap the neighbor button on all breakpoints.

### P3-4. Settings page section rhythm

Settings mixes full cards (profile, persona editor) with bare rows (notification toggles) and a segmented theme control — confirm the section headers (icon + label) and spacing are uniform; the notification rows in particular sit close to the card edge with no divider rhythm.

### P3-5. Stale chrome from dead routes

`nav-items.ts` now links Notifications + Analytics (good), but `TopBar` titles exist for `/notifications` and `/analytics` — confirm the `kbd` shortcuts (5/6) don't collide with the CommandPalette shortcut list, and that the settings page's old "email/push/marketing" copy is fully gone (it is — replaced by preference keys).

---

## What's already consistent (retain)

- Single `shadow-premium`, `rounded-xl`, `border-border/xx` language across panels and popovers.
- `PremiumCard`/`PremiumBadge` recipes are used consistently for cards.
- `PickerSurface` bottom sheet on mobile; `MobileBottomBar` + `NavigationRail` mobile chrome is coherent.
- `TonePicker`/`PersonaPicker`/`ToolPicker` all use the same `PickerSurface` pattern (good — extend it rather than fork).
- Reduced-motion is honored in landing animations; streaming has a dedicated `AIThinking` language.
- NotificationCenter type→icon map is a nice, consistent touch.

## Ranked fix list

| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | One Radix `Modal`/`Sheet` primitive for all 5 overlay styles | High | Medium |
| 2 | One `EmptyState` (+ error variant) everywhere | High | Small |
| 3 | Loading-state taxonomy (skeleton/spinner/`role=status`) | High | Small |
| 4 | Typography tokens for tiny text; kill 9–10px arbitraries | High | Small |
| 5 | Touch-target bump to ≥44px on icon buttons | Medium | Small |
| 6 | `rowHover`/`iconButton` recipes; hover-opacity consistency | Medium | Small |
| 7 | Motion + spacing + icon-size token adoption | Medium | Small |
| 8 | Single h1 per page | Low | Tiny |
| 9 | Scrollbar utility consistency | Low | Tiny |
| 10 | kbd, padding, badge-clip micro-fixes | Low | Tiny |
