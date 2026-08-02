# ToneCraft Design System

> Phase 7.3 — Design System 2.0 · Foundation only. No pages are redesigned yet.
> This document is the reference for all later Phase 7 redesign work.

## Scope

This document defines the **foundation** ToneCraft builds on: color, typography,
spacing, radius, elevation, z-index, icons, breakpoints, and accessibility.
Companion docs:

- [Motion-System.md](./Motion-System.md) — durations, easings, springs, variants, motion rules
- [Component-Guidelines.md](./Component-Guidelines.md) — component anatomy, states, recipes
- [UX-Principles.md](./UX-Principles.md) — interaction principles derived from the Phase 7.2 audit

## Token architecture

All tokens live in `src/styles/` as typed constants. They are the **single source
of truth** — do not hardcode values inside components.

| Concern       | Module                 | Primary export       |
|---------------|------------------------|----------------------|
| Color         | `src/styles/colors.ts` | `color`              |
| Spacing       | `src/styles/spacing.ts` | `spacing` / `space` |
| Typography    | `src/styles/typography.ts` | `typography` / `fontSize` |
| Border radius | `src/styles/radius.ts` | `radius` / `rounded` |
| Elevation     | `src/styles/elevation.ts` | `elevation` / `shadow` |
| Z-index       | `src/styles/z-index.ts` | `zIndex` / `z`      |
| Motion        | `src/styles/motion.ts` | `duration`, `ease`, `spring`, variants |
| Aggregate     | `src/styles/tokens.ts` | `tokens` (re-exports all) |

```ts
import { color, spacing, radius, elevation, zIndex } from "@/styles/tokens";
import { duration, ease, spring } from "@/styles/motion";
```

**Rule:** Class names (Tailwind utilities) remain the source of truth for CSS.
Tokens are for (a) values computed in JS and (b) documentation of the allowed scale.
Never invent a value that is not in a token module.

## 1. Color system

Two layers (see `colors.ts`):

1. **Semantic tokens** — `color.semantic.*` resolve to `hsl(var(--x))` and
   re-theme automatically when a theme class (`dark`, `midnight`, `aurora`,
   `glass`, `oled`) is applied via `globals.css`. Use these for every
   theme-aware surface.

   Core set: `background`, `foreground`, `card`, `popover`, `primary` (+ `foreground`),
   `secondary`, `muted` (+ `foreground`), `accent`, `destructive`, `border`,
   `input`, `ring`, `sidebar` (+ `foreground`).

2. **Static palettes** — fixed hex values, defined once:
   - `color.tone.*` — the 9 writing tones (`professional`, `friendly`, `creative`,
     `romantic`, `luxury`, `funny`, `minimal`, `corporate`, `academic`).
   - `color.toneExtended.*` — tool/suggestion tone aliases (`genz`, `casual`,
     `formal`, `sarcastic`, `dating`, …).
   - `color.platform.*` — platform brands (`whatsapp`, `linkedin`, `twitter`, …).
   - `color.status.*` — `success`, `warning`, `danger`, `info`.
   - `color.brand.*` — `violet`, `indigo`, `purple`, plus the `from-violet-600
     to-indigo-600` gradient used for the brand CTA.

### Rules
- Component surfaces use semantic tokens or utilities (`bg-card`, `text-muted-foreground`).
- Raw hex is allowed only inside `colors.ts` and `tailwind.config.ts`.
- Tone/platform colors are already centralized in `lib/constants.ts`
  (`TONES`, `FEATURES`, `PLATFORMS`) via `colors.ts`.
- Remaining hardcoded hex (tool definitions, prompt library, suggestion chips,
  capability registry, action ring) is tracked in the Phase 7.3 report and is
  scheduled for migration in a later phase — **do not add new copies**.

## 2. Typography

`src/styles/typography.ts` mirrors `tailwind.config.ts`.

### Type scale (px)
| Token | Size | Line height | Typical use |
|-------|------|-------------|-------------|
| `micro` (deprecated) | 10px | — | Legacy workspace labels — migrate to `xs`+ |
| `tiny` (deprecated) | 11px | — | Legacy — migrate to `xs`+ |
| `xs` | 12px | 1.5 | Meta, captions, sidebar groups |
| `sm` | 14px | 1.5 | Body, list items |
| `base` | 16px | 1.6 | Default body |
| `lg` | 18px | 1.6 | Lead paragraphs |
| `xl` | 20px | 1.5 | Card titles |
| `2xl`–`9xl` | 24–128px | 1.4→0.9 | Section/hero headings |

### Weights
`normal` (400), `medium` (500), `semibold` (600), `bold` (700).
Use weights for hierarchy; **do not** mix many families. Sans = `Inter`
(`--font-sans`), mono = `JetBrains Mono` (`--font-mono`) for code only.

### Type rules
- Minimum legible size for UI text: **12px** (`xs`). The legacy 9–11px sizes are
  scheduled for removal in Phase 7.
- Headings use `tracking-tight`; hero display uses `leading-[0.95]–1.05`.
- Never set font-size/line-height inline when a scale token exists.

## 3. Spacing

`src/styles/spacing.ts` — 4px base grid (`0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128`).

- Use the 4px grid for padding, margins, gaps.
- Horizontal rhythm inside cards/sections: `space-y-3`/`space-y-4` (12/16px).
- Component spacing presets live in `recipes.ts` (`recipe.card`, `recipe.sidebar`, …).
- **No ad-hoc px values** (`p-[17px]`) — extend the scale if needed.

## 4. Border radius

`src/styles/radius.ts`:

| Token | Value | Typical use |
|-------|-------|-------------|
| `xs` | 4px | badges, dots |
| `sm` | 6px | inputs, small controls |
| `md` | 8px | buttons, list items |
| `lg` | 12px | cards, panels |
| `xl` | 16px | large cards, composer |
| `2xl` | 16px | message bubbles |
| `3xl` | 24px | hero elements |
| `4xl` | 32px | large hero panels |
| `full` | 9999px | pills, avatars, dots |

Rules: surfaces of the same elevation share a radius; bubbles use the
`rounded-bl-sm`/`rounded-br-sm` "speech" treatment from `recipe.message`.

## 5. Elevation / shadows

`src/styles/elevation.ts`:

- Generic ramp: `sm`, `md`, `lg`, `xl`.
- Branded: `card`, `premium`, `glass`, `dock`, `innerGlow`.
- Glow (primary-keyed): `glow`, `glowLg` — reserved for the primary CTA and
  active/streaming elements. **Not** for every card.
- Overlay: `overlay`, `modal`.

Rules: elevation expresses stacking, not decoration. Use `shadow-glow` sparingly;
25 current usages is too many and dilutes the effect (see report).

## 6. Z-index

`src/styles/z-index.ts` semantic stack:

```
base 0 → content 1 → sticky 10 → dropdown 30 → sidebar 40 → overlay 50 → top 60 → cursor 9999
```

Use the named layers. `9999` is reserved for the premium cursor only.

## 7. Icons

Library: `lucide-react` (+ `social-icons.tsx` for LinkedIn/Twitter brand marks).

- 16px (`w-4 h-4`) inside buttons/rows, 20px in avatar/emoji tiles, 24px+ for
  empty states and feature icons.
- Icon-only controls **must** have `aria-label` (and `title` where helpful).
- Do not mix icon styles (stroke weight) within a surface.
- Brand icons (LinkedIn/Twitter/Instagram) come from `social-icons.tsx` — keep
  brand marks there, never re-draw them.

## 8. Responsive breakpoints

Standard Tailwind set — nothing custom:

| Breakpoint | Min width | Behavior |
|------------|-----------|----------|
| `sm` | 640px | Two-column cards |
| `md` | 768px | Dashboard chrome adapts |
| `lg` | 1024px | Three-column cards |
| `xl` | 1280px | Full desktop spacing |
| `2xl` | 1400px | Container cap |

Known gap (from audit): the chat workspace (`WorkspaceLayout`, `ConversationSidebar`,
`AIContextPanel`) has **no responsive handling** — fixed 280px sidebar and 320px
context panel. Fixing this is a Phase 7 task (drawer pattern under `md`); token
values for those widths live in `tokens.sidebar` / `tokens.topnav`.

## 9. Accessibility rules

- **Touch targets** ≥ 40px (prefer 44px). Current `h-7`/`w-7` (28px) icon buttons
  are below standard — migrate upward.
- **Contrast** ≥ 4.5:1 for body text; `muted-foreground` must stay ≥ 4.5:1 on
  its surface. Current `…/30–50` opacity text is below AA — reduce opacity use.
- **Focus** — every interactive element needs a visible `focus-visible` state.
- **Reduced motion** — all motion must respect `prefers-reduced-motion`
  (`useReducedMotion` in `src/hooks/use-reduced-motion.ts`; `use-motion-config.ts`
  provides reduced-aware variants). No infinite animation behind the gate.
- **Semantics** — use real buttons/links; menus via `dropdown-menu.tsx`;
  modals via `dialog.tsx` (focus trap, Escape, `aria-labelledby`).
- **Hover-reveal** controls must also be reachable on focus/touch.

## 10. Usage checklist (new UI)

1. Colors from `color.*` or utilities — never raw hex.
2. Sizes from the type scale — nothing below `xs`.
3. Spacing on the 4px grid.
4. Radius from `radius`.
5. Elevation from `elevation`, used sparingly.
6. Z-index from the semantic stack.
7. Motion from `motion.ts` presets (see Motion-System.md).
8. Icons from `lucide-react` with labels where icon-only.
9. Responsive from the breakpoint list; workspace chrome needs drawer handling.
10. Reduced-motion variant wired via `useReducedMotion`.
