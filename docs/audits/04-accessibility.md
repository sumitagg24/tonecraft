# Accessibility Audit — WCAG 2.2 AA

Date: 2026-08-02
Scope: read-only static audit of the ToneCraft Next.js App Router frontend.
Method: manual source review. Findings are code-level; contrast ratios are class-PATTERN risks and must be verified in a live browser.

Status summary:

- **Critical: 2** — core functionality unreachable by keyboard / never announced.
- **Major: 10** — dialog/keyboard pattern failures, unlabeled controls, unreachable actions.
- **Minor: 17** — target sizes, contrast-opacity patterns, hover-only affordances, semantics.
- **Enhancement: 5** — non-blocking robustness and polish.

---

## Critical

### C1. Tools grid is unreachable by keyboard (2.1.1)
`src/components/tools/ToolCard.tsx:17-21` passes `onClick` to `PremiumCard`, which renders a bare `motion.div` (`src/components/ui/recipes/PremiumCard.tsx:16-24`). The `interactive` prop only adds hover animation. No `role="button"`, no `tabIndex`, no key handler — mouse-only. Every tool on `/tools` is keyboard-inaccessible, so the entire tools feature fails.
Fix: render a real `<button>` (or `<Link>`), or add `role="button"` + `tabIndex={0}` + Enter/Space handler on the card.

### C2. Streaming replies and thinking phases are never announced (4.1.3)
`src/app/(dashboard)/chat/[chatId]/page.tsx:140-157` streams tokens into `PremiumMessageCard`, whose content region (`src/components/workspace/PremiumMessageCard.tsx:227-299`) has no `aria-live`/`role="status"`. The pre-stream status (`src/components/workspace/AIThinking.tsx:35-46`, "Thinking/Crafting/Refining/Polishing", and `ResponseIncoming`, :124) also has no live region. A screen-reader user gets zero feedback that the AI is working or that the reply has arrived.
Fix: wrap the streaming message container and the thinking indicator in `aria-live="polite"`.

---

## Major

### M1. Command palette: no Escape, no focus trap, no focus restore (2.1.2, 2.4.3)
`src/components/layout/CommandPalette.tsx:107-111` — `onKeyDown` handles only ArrowUp/ArrowDown/Enter. The UI advertises ESC (`<kbd>` at :160 and footer hint at :220) but nothing listens for it. The overlay (:135-138) is a plain backdrop: focus is not contained, so Tab walks out into the page behind the modal, and on close focus is dropped to `body` instead of returning to the trigger.
Fix: global Escape listener while open, trap Tab/Shift+Tab inside the dialog, restore focus to the trigger on close.

### M2. Command palette results: selection state not exposed to assistive tech (4.1.2)
`src/components/layout/CommandPalette.tsx:180-203` — results are plain `<button>`s; the arrow-key highlight is visual-only. No `role="combobox"`/`listbox`, no `aria-activedescendant`, no `aria-selected`. Screen readers hear every button but never which one is highlighted.
Fix: implement the combobox pattern (or use `aria-activedescendant` on the input with `role="listbox"` options).

### M3. Prompt library modals: no dialog role, no focus trap, no Escape, no focus restore (2.1.2, 2.4.3, 4.1.2)
`src/components/workspace/PromptLibraryPage.tsx` — `PromptEditor` (:346-426) and `PromptRunDialog` (:473-537) are `fixed inset-0 z-50` divs with no `role="dialog"`, no `aria-modal`, no focus management, and no Escape handler. Tab escapes behind the overlay; nothing returns focus on close.
Fix: add `role="dialog"` + `aria-modal`, trap focus, close on Escape, restore focus.

### M4. PickerSurface bottom sheet declares dialog role but has no focus management (2.1.2, 2.4.3)
`src/components/workspace/PickerSurface.tsx:36` — `role="dialog"` on the mobile sheet, but no `aria-modal`, no focus trap, no Escape handler, no focus restore on close. Keyboard focus can leave the sheet into the page behind.
Fix: trap focus, handle Escape, return focus to the trigger on close.

### M5. Message action bar is keyboard-unreachable on older messages (2.1.1, 1.3.1)
`src/components/workspace/PremiumMessageCard.tsx:62` — `actionsVisible = !isStreaming && (isTouch || showActions || isLastMessage)`. `showActions` only flips via `onFocusCapture` (:135-136), which requires a focusable element inside the card. A non-last assistant message containing only plain text has no focusable element, so its Copy/Regenerate/Like/Dislike/Bookmark bar never renders and can never be reached.
Fix: always render the action bar (or make the message bubble itself focusable to trigger it).

### M6. Conversation context menu: no focus moved into menu, no Escape (2.1.2)
`src/components/workspace/ConversationSidebar.tsx:388-395` toggles the menu with `aria-expanded`, but focus stays on the trigger; menu items (:408-428) are only reachable after tabbing through the rest of the row, and there is no Escape handler — only backdrop click (:401-407) closes it.
Fix: move focus into the menu on open, close on Escape, return focus to the trigger.

### M7. Prompt library Import control is mouse-only (2.1.1)
`src/components/workspace/PromptLibraryPage.tsx:124-128` — a `<label>` wraps a `className="hidden"` file input. The label is not focusable and the hidden input is not keyboard-reachable; only a mouse click on the label opens the picker.
Fix: use a real `<button>` that opens a visible (or `sr-only`, focusable) file input.

### M8. `role="button"` divs ignore the Space key (2.1.1)
- `src/components/workspace/ConversationSidebar.tsx:348-351` — Enter handled (:351), Space ignored.
- `src/components/workspace/PersonaPicker.tsx:102-107` (favorite star) and :113-121 (edit) — Enter handled, Space ignored.

Buttons activated by Enter but not Space fail the button key convention.
Fix: also handle `e.key === " "` (prevent default scroll) on all three.

### M9. Notification switches have no accessible names (1.3.1, 4.1.2)
`src/app/(dashboard)/settings/page.tsx:291-302` — each row pairs a `<p>` label with a Radix `<Switch>` that has no `aria-label`/`aria-labelledby`. Screen readers announce an unlabeled checkbox.
Fix: add `aria-label={label}` (or `aria-labelledby`) to each `Switch`.

### M10. ToolPanel close button and form controls are unlabeled (4.1.2, 1.3.1)
`src/components/tools/ToolPanel.tsx:85` — icon-only close `<Button>` with no `aria-label`. The `Label`+`textarea` (:92-98), `Label`+`Select` (:103-113, :116-127) and the Creativity `Slider` (:135) are not programmatically associated (`no htmlFor/id`, slider has no accessible name).
Fix: `aria-label="Close"` on the close button; tie labels to controls; add `aria-label` to the slider.

---

## Minor

### m1. Touch target sizes below 44px (2.5.8)
The app ships many sub-44px controls:
- `src/components/ui/switch.tsx` — `h-6 w-11` (24px tall)
- `src/components/workspace/ToolPicker.tsx:88` — CategoryChip `h-6`
- `src/components/workspace/PersonaPicker.tsx:106,117` — `h-6 w-6`
- `src/components/workspace/PremiumMessageCard.tsx:424` — `sm:h-7 sm:w-7` action buttons
- `src/components/workspace/ConversationSidebar.tsx:390` — More-actions `h-7 w-7`
- `src/components/tools/ToolPanel.tsx:166` — copy `h-7`
- `src/components/shell/TopBar.tsx:60,67,103` and `NavigationRail` — `h-8 w-8`
- `src/app/(dashboard)/settings/page.tsx:190-195` — `size="icon"` delete
- `src/components/workspace/PromptLibraryPage.tsx:298-301` — `h-7 w-7`

Fix: bump to ≥44px (or ≥24px with adequate spacing per 2.5.8 exception).

### m2. Low-contrast opacity text (1.4.3) — verify in browser
Pervasive `text-muted-foreground/40|50|60|70` and `text-[9px]`/`text-[10px]` tokens, e.g.:
`ConversationSidebar.tsx:383` (`/40` timestamp), `PersonaPicker.tsx:98` (`/60`), `ToolPicker.tsx:69` (`/60` desc), `CommandPalette.tsx:170,195,217,223`, `PremiumMessageCard.tsx:313` (`/40`), :317 (`/30` tokens), :282 (blockquote `/80` italic), `PromptLibraryPage.tsx:121,208,292,296`, `ToolPanel.tsx:162`, `InteractiveDemo.tsx:140`.
Base `muted-foreground` tokens (globals.css: light `240 3.8% 46.1%`, dark `240 5% 64.9%`) are plausible but opacity-modified variants almost certainly dip below 4.5:1. Measure and bump to ≥70% or use a fixed lighter token.

### m3. Placeholder contrast (1.4.3)
`placeholder:text-muted-foreground/40` in `CommandPalette.tsx:157`, `ToolPicker.tsx:34`, `PromptLibraryPage.tsx:154`, and `/50` in `InteractiveDemo.tsx:140`; the shared `Input` component also uses a low-opacity placeholder. Placeholder text is content — verify ≥4.5:1.

### m4. Standalone spinners without `role="status"` (4.1.3)
`search/page.tsx:32`, `settings/page.tsx:162`, `billing/page.tsx:203,272`, `KnowledgeLibraryPage.tsx:150`, `PersonasLibraryPage.tsx:291`, `KnowledgePicker.tsx:44`. Where loading is only a spinner, the state change is silent. Add `role="status"` or a visually-hidden live text.

### m5. Hover-only visible actions that stay tabbable (1.4.1, 2.4.7)
`PromptLibraryPage.tsx:285` (favorite star) and :297-302 (preview/run/edit/delete) use `opacity-0 group-hover:opacity-100` with no `focus-visible` override — keyboard users Tab into invisible buttons. (The copy-code button at `PremiumMessageCard.tsx:241` does it correctly with `focus-visible:opacity-100`.) Add `focus-visible:opacity-100`.

### m6. Unlabeled icon-only buttons (4.1.2)
`PersonasLibraryPage.tsx:271,283` — modal close `<Button size="icon"><X/></Button>` with no `aria-label`. (KnowledgeLibraryPage:176, ToolPanel:85 already noted.) Add `aria-label="Close"`.

### m7. Toggle/tab groups expose state by color only (4.1.2)
`ToolPicker.tsx:83-94` (CategoryChips), `settings/page.tsx:257-273` (theme options), `library/page.tsx:25-38` (custom tabs — not the Radix Tabs primitive, so no `tablist`/`aria-selected`). Add `aria-pressed`/`aria-selected` or `aria-current`.

### m8. Demo tone radiogroup is not roving (1.3.1, 2.4.3)
`InteractiveDemo.tsx:145-162` — correct `radiogroup`/`radio`/`aria-checked` semantics, but all radios are tabbable instead of arrow-key roving (single tab stop + ArrowUp/Down). Minor.

### m9. Nested interactive controls (4.1.2)
`ConversationSidebar.tsx:339-396` — the row `div[role="button"]` contains a real `<button>` (More actions, :388). Nested interactive elements are confusing to screen readers. Split the row semantics or use a single composite control.

### m10. Missing focus-visible rings on some custom buttons (2.4.7)
`ToolPicker.tsx:85-94` (CategoryChip), `ConversationSidebar.tsx:438-448` (context menu items), `PromptLibraryPage.tsx:163-176` (view toggle). Add `focus-visible:ring-2` etc.

### m11. Labels not programmatically associated (1.3.1)
`ToolPanel.tsx:92-98,103-127`; `PromptLibraryPage.tsx` editor labels (:362-385) are plain `<label>` with no `htmlFor`/`id`. Wire up associations (or wrap controls).

### m12. Command palette trigger lacks dialog semantics (4.1.2)
`TopBar.tsx:92-99` — the trigger has `aria-label="Command palette"` but no `aria-haspopup="dialog"`/`aria-expanded`.

### m13. Duplicate page headings (1.3.1, 2.4.6)
`TopBar.tsx:73` renders an `<h1>` for every dashboard page, while several pages render their own `<h1>`: `search/page.tsx:15`, `billing/page.tsx:114`, `PromptLibraryPage.tsx:117` (also Personas/Knowledge library pages). Two `h1`s per page. Make TopBar's title an `<h2>`/`<p>` or drop the in-page `h1`.

### m14. Selection in onboarding conveyed by color + badge, no ARIA (4.1.2)
`onboarding/page.tsx:109-123,142-160,178-201` — step option buttons show selection via border/`bg-primary/5` plus a visible "Selected" badge (badge is text, so partially OK), but no `aria-pressed`/`aria-checked`. Add the attribute.

### m15. Streaming cursor / decorative animations not hidden consistently (1.1.1)
Most decorative animations are fine, but the streaming block-cursor (`PremiumMessageCard.tsx:303-308`) and `AIThinking` wave bars (:79-96) are never `aria-hidden`. Harmless but noisy in some SR configurations — consider `aria-hidden="true"`.

### m16. Context menu items lack a focus ring (2.4.7)
`ConversationSidebar.tsx:438-448` — `ContextMenuItem` buttons have no visible focus style. Covered by m10; listed for completeness.

### m17. `title`-based tooltips only (1.4.13, 2.5.1)
`InlineActionRing.tsx:128,144` and attachment chips (`PremiumMessageCard.tsx:338`) rely on `title`/hover labels. Native `aria-label`s exist on the ring buttons (good); the attachments expose the filename as visible text already — acceptable, but hover-only info elsewhere should be paired with `aria-label`.

---

## Enhancement

### E1. Persist and restore focus across layout toggles
`AppShell.tsx:29-38` registers `cmd+k/n/1-4` shortcuts. Global shortcuts don't announce their existence; consider listing them in a visible/`aria-label`-able help surface.

### E2. `NavigationRail` roving tabindex is good — document it
`NavigationRail.tsx:41-53` implements a proper roving-tabindex rail with ArrowUp/Down and `aria-current` (confirmed :94). Keep this pattern; replicate it in any future toolbar.

### E3. Reduced-motion already honored — verify coverage
`useReducedMotion` is used in `InteractiveDemo.tsx:48,72` and `PremiumCard.tsx`. Ensure the streaming wave/cursor and `BackToTop` animations are also gated by reduced-motion.

### E4. Mark streaming output with `role="log"` for full-history review
Beyond `aria-live="polite"` (C2), a `role="log"` on the message list gives screen-reader users a clean "new message" announcement boundary as tokens stream.

### E5. Add unit-level a11y smoke checks
A tiny Playwright/axe check on `/tools`, `/chat`, `/library`, and the command palette would catch regressions of C1, M1, M3, M4 mechanically. Suggest only after the above fixes land.

---

## Focus-trap / keyboard-containment bugs (recap)

Confirmed focus-management defects (focus can escape a modal and nothing is restored on close):

1. **CommandPalette** (`CommandPalette.tsx:135-138`, `:107-111`) — no trap, no Escape, no restore → focus falls to `body` on close.
2. **PromptEditor / PromptRunDialog** (`PromptLibraryPage.tsx:346-426`, `:473-537`) — no dialog semantics, no trap, no Escape, no restore.
3. **PickerSurface** (`PickerSurface.tsx:36`) — `role="dialog"` but no trap/Escape/restore on all pickers.
4. **ConversationSidebar context menu** (`ConversationSidebar.tsx:388-428`) — focus never enters the menu; Escape unsupported.

No true "keyboard imprisonment" (trap-without-exit) exists — the failure direction is the opposite: focus leaks out of modals and is never returned.

---

## Existing good practices (retain)

- Skip-to-content link (`app/layout.tsx:85-86`).
- Consistent `h1` strategy via TopBar + landing Hero (`Hero.tsx:26`).
- Radix dialog/sheet/tabs/accordion/select inherit focus trap + Escape + `aria-expanded`.
- `Button`/`Input` have `focus-visible:ring-2`.
- PremiumComposer toolbar buttons carry `aria-label` + `aria-expanded` (`PremiumComposer.tsx:269-377`).
- Message action buttons carry `aria-label`s (`PremiumMessageCard.tsx:364-391`).
- One intentional live region exists: `TonePicker.tsx:104` `aria-live="polite"`.
- Landing decor is consistently `aria-hidden` (`Hero.tsx:11-12`).
