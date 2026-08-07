# ToneCraft — Visual Identity

> Phase 4 · The design language: type, color, space, icon, border, radius, surfaces.
> Nothing technical here — the *philosophy* of the visual system. Token names come from `src/styles/*`; exact values in `Design-System-v1.md` and `MASTER.md`.

---

## 1. Typography Philosophy

**Type leads. Everything else follows.**

- **One family**: Inter everywhere — UI, headings, body. Monospace (Inter Mono) is a *voice*, reserved for code, commands, and technical labels. No font mixing.
- **Hierarchy via contrast, not decoration**: scale jumps (6XL → 2XL → BASE), weight (700 → 600 → 500 → 400), and color priority (foreground → muted) carry the structure. No serif "brand moments," no all-caps everywhere.
- **Headlines breathe**: tight tracking (`-0.02em`), tight leading (1.05–1.25), generous padding around. Display text is the hero of every page.
- **Body stays legible**: ≥14px body, ≥12px minimum with an accessibility override; 16px is the comfortable default.
- **Numbers are tabular** wherever they update (counters, credits, metrics).

## 2. Spacing Philosophy

**The 4px rhythm is law.**

- Everything aligns to the 4px grid: `space-x-3/4`, `space-y-3/4`, padding `-4/-6`, section gaps `-8/-10`.
- **Whitespace is the luxury material.** When a layout feels tight, the answer is more space — never smaller type.
- Cards get `p-6` (24px); page sections get `space-y-8`; the app shell breathes with 32–48px outer padding on desktop.
- No ad-hoc values. Extend the scale, don't break it.

## 3. Color Philosophy

**85 / 10 / 5.**

- **85% neutral** — semantic tokens and their tints/shades carry 85% of the interface. Restraint is the default.
- **10% functional accent** — `primary` (violet `#6C64EE`) and `secondary` (lavender) for core actions and active states.
- **5% expressive accent** — tone colors (the 9 writing voices) and status colors, used only where they *mean* something: tone chips, citations, AI states.
- **Amber `#FFB800`** is the action highlight — used sparingly for upgrade/premium moments and warnings.
- Color is **semantic first**: `hsl(var(--background))` etc. so themes re-skin automatically. Hex values exist only in `src/styles/colors.ts`.

## 4. Icon Language

- `lucide-react`, 16px controls / 20px tiles / 24px empty-state heroes.
- Stroke-weight consistency within a surface — never mix thin and heavy icons side by side.
- Icon-only controls always carry `aria-label`.
- Icons *assist* labels; they never replace the word unless the context is unambiguous (rail with tooltips).

## 5. Border Language

- **1px**, `border-border` (≈10% opacity) or `border-border/40` on glass. Hairline, never chunky.
- Borders **separate, shadows elevate** — if a surface needs emphasis, give it elevation, not a darker border.
- Dividers are `divide-border` hairlines with generous padding around them.
- Selected states use rings (`ring-2 ring-ring/ring-offset-2`), not border color swaps.

## 6. Radius Philosophy

**Radius signals intimacy.** Small surfaces touch more (small radius), big surfaces float more (large radius).

- Controls: `sm–md` (6–8px) · Cards: `lg–xl` (12–16px) · Hero/premium: `2xl–4xl` (16–32px) · Pills/avatars: `full`.
- One radius family per surface — never mix `sm` and `3xl` on the same card.
- Interactive elements take the next radius size up from their container (a button inside an `xl` card is `lg`).

## 7. Card Philosophy

- Cards are **quiet containers**: `bg-card`, `border-border`, `elevation.md`, `radius-lg`, `p-6`.
- The card's job is grouping + hierarchy, not decoration. If the layout doesn't need a boundary, use whitespace instead.
- Hover: lift `-4px` with `premium` shadow (`hoverLift.card`) — the card *rises*, it never glows.
- Premium cards (pricing, hero features) may use glass or the violet glow — earned, not default.

## 8. Button Philosophy

- **Primary**: solid `bg-primary`, `radius-md`, `elevation.md` → hover lifts and brightens slightly; press scales to 0.98. The primary button on any screen is violet and unambiguous.
- **Secondary**: `bg-secondary` — the workhorse for inline actions.
- **Ghost / Outline**: reserved for tertiary actions and toolbar rows — they recede so the primary can lead.
- **Gradient** (violet→indigo): one per screen max, for the single most important moment (hero CTA).
- Buttons are `h-9/10`, text `sm`, with `gap-2` icons. Never two equally loud CTAs side by side.

## 9. Input Philosophy

- Inputs are **fields, not boxes that fight the page**: `h-10`, `radius-md`, `bg-background`, `border-input`, focus ring `ring-primary`.
- Labels sit above, `sm`/`medium`, with helper text in `muted-foreground` below. Placeholder is a hint, never a replacement for the label.
- Validation is visible: red ring + inline message, but only after the user has had a chance to type (no pre-emptive errors).
- The composer is the crown input — full-width, generous `p-4`, tone chips and tool buttons integrated beside, never stacked awkwardly.

## 10. Motion Philosophy

- **Motion communicates state** — every animation answers "what just happened / what's happening now?"
- Fast and precise for interactions (`instant`/`fast`), calm and spacious for entrances (`normal`/`slow`), springy only for delight moments (modals, tool activation).
- **Paired entrances and exits** — nothing appears that doesn't have a way to leave.
- Stagger is the tool for lists (≤0.08s), not a blanket effect.
- `prefers-reduced-motion` collapses all decorative motion to opacity-only or none. Full token map in `Motion.md`.

---

*Reference: `Design-System-v1.md` (exact values), `MASTER.md` §4–10, `src/styles/tokens.ts`.*
