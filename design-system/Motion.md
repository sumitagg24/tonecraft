# ToneCraft — Motion Guide

> Phase 7 · The motion language, per element.
> Every preset referenced below exists in `src/styles/motion.ts` — **use presets, never inline values.**
> Companion to `MASTER.md` §10 (durations/easings) and `Visual-Identity.md` §10.

---

## 0. Ground Rules

1. **Presets only** — `duration`, `ease`, `spring`, `MotionPresets`, `MotionStagger`, `ai`, `loading` from `src/styles/motion.ts`. Inline numbers are review-fail.
2. **Paired exits** — every entrance variant has an exit. Use `AnimatePresence` when conditionally rendering.
3. **Stagger ≤ 0.08s** between children; containers only in lists/grids.
4. **Reduced motion** — gate all decorative motion behind `useReducedMotion()`: collapse to opacity-only (or none). Infinite loops never run without a gate.
5. **Motion serves meaning** — if you can't name what the animation communicates, remove it.

## 1. Duration & Easing (from `motion.ts`)

| Token | Value | Use |
|---|---|---|
| `duration.instant` | 0.1s | Icon hovers, tap feedback |
| `duration.fast` | 0.2s | Buttons, chips, toggles |
| `duration.normal` | 0.35s | Sidebar, panels, card entrances |
| `duration.slow` | 0.5s | Page transitions, modals |
| `duration.verySlow` | 0.7s | Hero reveals |

| Easing | Use |
|---|---|
| `ease.default` | Standard UI |
| `ease.out` / `ease.inOut` | Entrances / expand-collapse |
| `ease.emphasizedDecel` | Page enter, section reveals (fast start, calm landing) |
| `ease.emphasizedAccel` | Page exit |
| `spring.snappy/gentle/soft/elastic` | Delight moments only |

## 2. Buttons

| State | Motion | Preset |
|---|---|---|
| Hover | Scale 1.02, subtle shadow lift | `hoverScale.button` |
| Press | Scale 0.98, inner shadow | `hoverScale.button` (whileTap) |
| Icon button | Scale 1.05 / 0.95 | `hoverScale.icon` |
| Primary CTA | Hover lift + glow deepen | `hoverScale.button` + `elevation.premium` transition |
| Loading | Spinner replaces label content (no layout jump) | `loading.spin` |

**Never**: rotating/shimmering buttons for decoration.

## 3. Cards & Surfaces

| Element | Motion | Preset |
|---|---|---|
| Card hover | Lift `-4px`, shadow `premium` | `hoverLift.card` |
| Pricing card hover | Lift `-6px` | `hoverLift.pricing` |
| Card entrance (list/grid) | Fade + rise, staggered | `MotionStagger.Normal` / `.Grid` |
| Card entrance (feature) | Fade + rise 30px | `MotionPresets.CardEntrance` |
| Tilt card (premium) | 3D tilt + lift on hover | `card3D` (`TiltCard`) |
| Selected state | Soft scale + ring highlight | `hoverScale.card` + ring |

## 4. Navigation & Shell

| Element | Motion | Preset |
|---|---|---|
| Sidebar expand/collapse | Width/transform, `normal` | `sidebarTransition`, `slideRight` |
| Sidebar items (load) | Staggered slide from left | `MotionStagger.Sidebar` |
| Active nav indicator | Layout slide between items | framer `layoutId` (one shared element) |
| Top bar / toolbar appear | Fade + drop 8px | `MotionPresets.ToolbarAppear` |
| Notification toasts | Drop from top | `MotionPresets.Notification` |

## 5. Modals, Drawers, Dialogs

| Element | Motion | Preset |
|---|---|---|
| Modal | Backdrop fade + card `fadeInScale` | `MotionPresets.ModalOpen`, `modalTransition` (spring 300/25) |
| Drawer | Slide from edge | `MotionPresets.DrawerOpen` (`slideRight`/`slideLeft`) |
| Context panel | Fade + scale | `MotionPresets.FloatingPanel` |
| Popover/tooltip | `instant–fast` fade, anchored | `scaleIn` + `ease.default` |

**Rule**: escape/overlay dismissal mirrors the entrance (same duration, `ease.in`).

## 6. Page & Section Transitions

| Element | Motion | Preset |
|---|---|---|
| Route change | Fade + slight rise, `slow`/`emphasizedDecel` enter, `normal`/`emphasizedAccel` exit | `pageTransition` |
| Section reveal | Staggered children with `0.08s` offset, `0.1s` delay | `MotionPresets.SectionEntrance` + `SectionItem` |
| Section chips/pills | Scale + fade in | `MotionPresets.SectionChip` |
| Hero headline | Word-by-word blur reveal | `MotionPresets.WordReveal` (`wordReveal`, 0.04s/word) |

## 7. Chat & AI (the heart of the product)

| Moment | Motion | Preset |
|---|---|---|
| User message | Slide in from right | `messageVariants.outgoing` |
| AI message | Rise + fade + scale 0.98 | `messageVariants.incoming` |
| Message list load | Staggered, delayed | `MotionStagger.Messages` |
| AI thinking | Pulse scale/opacity on avatar + reasoning label | `ai.thinking` |
| Streaming text | Opacity shimmer + gentle caret | `ai.streaming` |
| Token/tool executing | Icon pop-in with rotation | `ai.toolActivated` |
| Suggestion chips | Rise + scale spring | `ai.suggestionChip` |
| Provider switch | Fade + slide 5px | `ai.providerSwitch` |
| Context/knowledge attached | Surface flash at primary 10% | `ai.contextUpdate` |
| Response complete | Snap-in scale | `ai.responseFinished` |
| Typing indicator (3 dots) | Bounce + fade | `loading.typing` |

## 8. Loading States

| Duration | Pattern | Preset |
|---|---|---|
| < 2s | Indeterminate spinner (small) | `loading.spin` |
| 2–10s | Progress bar (linear) | `loading.shimmer` on bar |
| Content area | Skeletons with pulse | `loading.pulse` |
| Generative (AI) | Thinking pulse + labels — **never a bare spinner** | `ai.thinking` |
| Background/hero | Slow breathing glow | `loading.breathe` |

## 9. Empty & Error States

- **Empty state**: illustration/icon fades + rises (`fadeInUp`), then the CTA chip appears (`sectionChip`) — leads the eye *to the action*.
- **Error state**: icon `scaleIn` with destructive color; message `slideDown`; no shake/glitch theatrics.
- Dismiss/reload transitions mirror entrances (`fadeInUp` exit).

## 10. Accessibility

- `useReducedMotion()` collapses decorative motion to opacity-only or removes it entirely.
- Nothing auto-plays without user intent (except loading indicators tied to an action).
- Motion never carries information alone — states are always also conveyed by text/color.
- Stutter-free: animate `transform`/`opacity`/`filter` only — never layout properties (except height for expand/collapse via `expandCollapse`).

---

*Source of truth: `src/styles/motion.ts` (duration, ease, spring, hoverScale, hoverLift, MotionPresets, MotionStagger, ai, loading).*
