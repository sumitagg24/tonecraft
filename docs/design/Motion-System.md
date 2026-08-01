# Motion System

> Centralized motion for ToneCraft. All motion tokens and presets live in
> `src/styles/motion.ts` (24 importing files). Hooks: `useReducedMotion`
> (`src/hooks/use-reduced-motion.ts`) and reduced-aware variants in
> `use-motion-config.ts`.

## 1. Duration tokens

| Token | Seconds | Typical use |
|-------|---------|-------------|
| `instant` | 0.1 | icon hover, tap feedback |
| `fast` | 0.2 | buttons, chips, small toggles |
| `normal` | 0.35 | sidebar/panel, card entrances |
| `slow` | 0.5 | page transitions, modals |
| `verySlow` | 0.7 | hero, large reveals |

```ts
import { duration, ease } from "@/styles/motion";
transition={{ duration: duration.normal, ease: ease.default }}
```

## 2. Easing tokens

| Token | Cubic-bezier | Use |
|-------|--------------|-----|
| `default` | 0.25,0.1,0.25,1 | standard UI |
| `in` | 0.4,0,1,1 | exits |
| `out` | 0,0,0.2,1 | entrances |
| `inOut` | 0.4,0,0.2,1 | expand/collapse |
| `emphasized` | 0.25,0.46,0.45,0.94 | cards, featured transitions |
| `emphasizedDecel` | 0.05,0.7,0.1,1 | material-style entrances |
| `emphasizedAccel` | 0.3,0,0.8,0.15 | exits |
| `linear` | linear | continuous loops (loading, marquee) |
| `spring` / `backOut` | — | spring transitions |

## 3. Spring presets

`spring.snappy | gentle | soft | heavy | elastic`

Use named springs instead of inline `{ type: "spring", stiffness… }`.

## 4. Preset variants & composites

- Base: `fadeIn`, `fadeInUp`, `fadeInScale`, `slideUp/Down/Left/Right`,
  `scaleIn`, `blurIn`, `expandCollapse`.
- Page/panel: `pageTransition`, `sidebarTransition`, `modalTransition`,
  `cardTransition`, `comboboxTransition`.
- Hover/tap: `hoverScale.{button,card,icon,sidebarItem,subtle}`, `hoverLift.{card,pricing}`.
- Loading: `loading.{spin,pulse,shimmer,typing,glow,breathe,marquee}`.
- Semantic: `MotionPresets.*` and `MotionStagger.{Fast,Normal,Slow,Grid,
  Sidebar,Messages,Templates,Cards}`.
- Chat: `messageVariants.{incoming,outgoing}`, `avatar`, `ai.*` (thinking,
  streaming, typing, reasoning, …).

## 5. Rules

1. **Prefer presets** — import `duration`/`ease`/`spring` or a named variant over
   inline magic numbers. The audit found 20+ inline `duration: X` values across
   components; migrate to tokens during component work in later phases.
2. **One loading indicator** — never stack the equalizer wave, gradient pulse,
   and "Generating…" simultaneously (current behavior; fix in redesign phase).
3. **Reduced motion** — every infinite/entrance animation must be disabled or
   simplified when `prefers-reduced-motion: reduce` via `useReducedMotion`.
   Currently only `PremiumCursor` respects this — extend to `AIThinking`,
   particles, aurora, and hero loops.
4. **Stagger ceiling** — stagger children ≤ 0.08s; containers only in lists.
5. **Exit animations** — always pair `AnimatePresence` exit with an exit variant;
   don't animate height on large content (use `layout` or opacity).
6. **Hover vs. tap** — hover scale ≤ 1.05 for controls, ≤ 1.02 for cards; tap
   scale ≤ 0.98. Match `hoverScale` presets.
7. **Respect `duration` tokens** — CSS `transition-all duration-200/300` is the
   Tailwind analogue; keep JS motion and CSS transitions in the same speed
   family (`fast`=200ms, `normal`=300ms).

## 6. Reduced-motion contract

`use-motion-config.ts` exports `useToneCraftMotion()` returning duration-zero
springs and fade-only variants when reduced motion is requested. Component work
should consume this hook (or the provider in `use-reduced-motion.tsx`) rather than
writing `shouldReduceMotion` checks inline.
