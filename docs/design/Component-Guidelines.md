# Component Guidelines

> Rules for building and evolving ToneCraft components. Foundation-only;
> component-level redesigns happen later in Phase 7.

## 1. Anatomy & layering

ToneCraft has three component tiers:

1. **UI primitives** (`src/components/ui/*`) — shadcn/Radix-based: `button.tsx`,
   `input.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `select.tsx`, `switch.tsx`,
   `tabs.tsx`, `tooltip.tsx`, `scroll-area.tsx`, `slider.tsx`, `badge.tsx`, `card.tsx`.
2. **Recipes** (`src/components/ui/recipes/*`) — composed surfaces built on tokens:
   `PremiumCard`, `PremiumPanel`, `PremiumBadge` (consume `src/styles/recipes.ts`).
3. **Feature components** (`src/components/workspace|landing|tools|chat/*`) —
   product-specific; composed from 1 + 2 + motion presets.

New components must reuse primitives. Do not hand-roll menus/dialogs when
`dropdown-menu.tsx`/`dialog.tsx` exist (Radix provides focus trap, Escape, ARIA).

## 2. Surface recipes (`src/styles/recipes.ts`)

`recipe.card`, `recipe.panel`, `recipe.toolbar`, `recipe.message`, `recipe.badge`,
`recipe.input`, `recipe.button`, `recipe.sidebar`, `recipe.divider`, `recipe.section`.

Use helpers (`cardRecipe`, `glassCard`, `interactiveCard`, `panelRecipe`,
`toolbarRecipe`, `sidebarItemRecipe`) instead of repeating class strings.
Extend recipes when a variant repeats ≥3 times — do not fork class strings.

## 3. Button rules

- Sizes: `sm`, `default`, `lg`, `xl` (via `button.tsx` variants) — no ad-hoc.
- Primary CTA uses the brand gradient (`color.brand.gradient`) + `shadow-glow`;
  one per view. **Secondary/default buttons are plain** — the glow is not for
  every card.
- Icon-only buttons: ≥40px target, `aria-label`, `title`.
- Disabled: `opacity-50 pointer-events-none` (recipe base) — keep affordance.
- Loading: swap label to spinner + text (`Loader2`), keep width stable.

## 4. Card & surface rules

- Radius `lg`/`xl`; elevation `shadow-card` at rest, `hover:-translate-y-0.5`
  on interactive cards (recipe.card.hover).
- Hover lift ≤ 4px; never animate layout-affecting properties (height/margin)
  except via framer `layout`.
- One elevation per surface; glow reserved for active/streaming/primary states.

## 5. Input rules

- Height ≥ 40px (`h-10`), `rounded-lg`, `border-border`, focus ring
  `ring-2 ring-primary/30` (recipe.input.base).
- Placeholder contrast: `text-muted-foreground/40` is currently below AA in
  places — raise to `/60` in Phase 7.
- Composer: autogrow ≤ 240px (`max-h-[240px]`), `min-h-[44px]`.

## 6. Icon rules

- `lucide-react` for all product icons; brand marks via
  `src/components/icons/social-icons.tsx`.
- 16px in controls, 20px in tiles, 24px+ in empty states.
- Icon-only buttons need `aria-label`; keep `title` for hover tooltips.
- Don't color-code meaning solely by icon — pair with label where critical.

## 7. Motion on components

- Entrances: `fadeInUp`/`fadeInScale` or `MotionStagger.*` for lists.
- Chips/pills: `MotionPresets.ChipAppear` (scaleIn).
- Messages: `messageVariants` + `AnimatePresence mode="popLayout"`.
- Always pair `exit` variants; gate infinite loops behind reduced motion.
- See Motion-System.md §5.

## 8. States every interactive component needs

`default · hover · active/pressed · focus-visible · disabled · loading (where async) · empty (lists) · error`

List/empty states use `WorkspaceEmptyState` variants (`NoChatsEmptyState`, etc.).
Prefer the shared `EmptyState.tsx` over bespoke empty markup.

## 9. Checklist before merging a component

- [ ] Uses primitives/recipes, no forked class strings
- [ ] All colors via tokens/utilities (no raw hex)
- [ ] Text ≥ `xs` (12px)
- [ ] Spacing on the 4px grid
- [ ] Touch target ≥ 40px; `aria-label` on icon-only controls
- [ ] Focus-visible styles present
- [ ] Motion from presets + reduced-motion safe
- [ ] No phantom controls (an action must do what it says)
