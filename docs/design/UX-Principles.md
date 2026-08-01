# UX Principles

> Interaction principles derived from the Phase 7.2 UX audit. These govern all
> Phase 7 redesign work. Priority ordering: trust > clarity > delight.

## 1. No phantom controls

**Principle:** every control does what its label/icon promises, and its state
reflects reality.

Known violations to fix during component redesign:
- Advanced Controls (Language, Creativity, Emoji Level, …) never reach the API.
- "Stop generation" doesn't abort the stream.
- Like/Dislike/Bookmark/Edit toasts without persisting.
- Attach-file and voice buttons have no handlers.
- Notification bell shows a permanent unread dot and does nothing.
- Settings notification toggles are local-only.
- "(/) for commands" advertises a system that doesn't exist.

**Rule:** ship the control or ship the honesty. No success toast without a side
effect. If a feature is "coming soon", label it so.

## 2. One primary action per surface

**Principle:** each view has exactly one obvious next step.

- Empty chat state: the composer/CTA is the action — not keyboard hints.
- Pricing card: one button per plan; "Free Forever" must not render disabled.
- Tool/prompt selection: choosing an item must visibly start the promised work
  (a template must insert its prompt — it must not create a silent empty chat).

## 3. Everything reachable on touch

**Principle:** hover must never be the only way to reach a control.

Known violations: message action bars (Copy/Regenerate/Like), sidebar "…" menus,
prompt-card favorite stars, the selection action ring (mouseup/keyup only).

**Rule:** controls are visible by default or revealed on `focus-within`;
touch targets ≥ 40px.

## 4. Honest, computed context

**Principle:** panels that describe the conversation show real data.

- "AI Context" memory/actions/presets are currently hard-coded fabrications —
  replace with live state or empty states.
- Status indicators (tokens, latency, "Generated", context usage) are
  implementation detail; show only what the user can act on, with the correct
  plan window (4K free / 16K pro).

## 5. Do the work, don't queue it

**Principle:** a quick action executes; it doesn't paste an instruction into the
input box.

- Selection ring actions should transform the selected text inline (or insert a
  ready-to-send draft), not prepend `Rewrite this: "…"` and force another send.
- Regenerate/Continue must refresh from the server; "Duplicate" must copy content.

## 6. Respect the user's data

- Archive is currently irreversible from the UI — every "reversible" action needs
  a real reverse path.
- Destructive actions (delete persona, delete account) confirm first.

## 7. Mobile is first-class

**Principle:** the workspace must be usable on a phone.

Known gap: zero responsive handling in the chat workspace (fixed 280px sidebar +
320px context panel). Phase 7 introduces drawer pattern under `md`.

## 8. Hierarchy over decoration

**Principle:** visual weight signals importance; excessive glow/motion dilutes it.

- One `shadow-glow` CTA per view; `shadow-glow` on 25 components today is too many.
- One loading indicator at a time; no equalizer + pulse + "Generating…" stack.
- Custom cursor, particles, and aurora are landing-only and reduced-motion safe.

## 9. Fewer paths to the same thing

**Principle:** consolidate duplicate entry points.

Known duplicates: four search surfaces (sidebar filter, ⌘⇧F overlay, ⌘K palette,
/search page) and two overlapping catalogs (Prompt Library + Tools). Converge on
one search backed by message-content search, and one tools surface.

## 10. Legibility floor

**Principle:** no UI text below 12px; body text ≥ 14px.

The 9–11px workspace chrome is scheduled for removal. Muted/opacity text must
keep ≥ 4.5:1 contrast.

---

### Severity conventions used in the audit
`Critical` (blocks core use / breaks trust) → fix first.
`High` → fix this phase.
`Medium` / `Low` → backlog with design-system support.
