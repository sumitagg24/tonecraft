# ToneCraft — Art Direction

> Phase 3 · The visual atmosphere: backgrounds, hero, texture, depth.
> How the ToneCraft "room" looks before any component is placed in it.
> Implementation tokens referenced here: `src/styles/colors.ts`, `src/styles/elevation.ts`, `src/styles/radius.ts`, `src/components/ui/effects/*`.

---

## 1. Background Style

The canvas is a **layered atmosphere**, not a flat color. Each theme (light / dark / midnight / aurora / glass / oled) stacks the same five layers:

```
Layer 1  Base canvas        — semantic background (hsl(var(--background)))
Layer 2  Soft radial glows  — very-low-opacity violet/indigo radials at the top & corners
Layer 3  Noise texture      — 3–5% SVG noise overlay (subtle film grain, not static)
Layer 4  Floating lights    — slow-drifting blurred orbs (aurora/hero surfaces only)
Layer 5  Interactive mesh   — optional FlowField / particle layer (marketing & landing only)
```

**Rules**
- Layers 1–3 are always present. Layers 4–5 are earned (hero, landing, empty states) — never on dense working screens.
- Radial glows use `color.brand.violet` / `color.brand.indigo` at ≤8% opacity in light mode, ≤12% in dark. Never full-saturation blooms on work surfaces.
- Noise is imperceptible at a glance — visible only when you look for it.

## 2. Lighting

- **Light**: soft, diffused, top-lit. Cards read as slightly elevated paper on a warm-white desk (`#FFFFFF` → `#FAFAFA` layering).
- **Dark**: deep, near-black navy/charcoal (`#1E1E1E` base), with the canvas *darker* than the cards — light rises from surfaces, not from the background.
- **Accent light**: violet/indigo glow is the only "colored light" source; it is reserved for active AI states, the primary CTA, and selected elements.
- **No harsh speculars** — no hard white gradients, no metal-shine effects.

## 3. Glass

Glass is a **premium material** in ToneCraft, not a default.

- `backdrop-blur-sm` → `backdrop-blur-xl` scaled by context
- Surface: `bg-card/60` with `border-border/40`
- Used for: floating panels, the command palette, context drawer, nav overlays, premium cards
- Glass must sit over *something* — blurred content behind is the point. Empty backgrounds get solid surfaces instead.
- Contrast floor: glass surfaces must still hit 4.5:1 on text (see `MASTER.md` §27).

## 4. Hero Style (Editorial)

```
Huge typography      — 5XL–8XL display sizing, semibold/bold, tight leading
Word morphing        — the headline word swaps tones/voices with blur-in animation
Animated cursor      — a soft glow cursor trails on premium/marketing surfaces
Particles / light    — sparse, slow, non-distracting (FlowField exists for this)
Glass cards          — feature cards float over the glow, faintly blurred
```

**Hero structure (landing)**
1. Ambient gradient glow (Layer 4) behind the headline
2. Display headline with a morphing tone-word
3. One primary CTA + one ghost secondary — never a cluster
4. Glass product preview card(s) below, angled slightly, casting soft shadow

## 5. Textures & Decorations

| Decoration | Where it's allowed | Implementation |
|---|---|---|
| Noise grain | Everywhere (Layer 3) | SVG feTurbulence, 3–5% opacity |
| Dotted/grid pattern | Empty states, section dividers | CSS radial-gradient dots at 8px pitch |
| Gradient rings | Tone chips, active states | `conic-gradient` at low opacity |
| Floating orbs | Hero, empty states, premium panels | CSS blurred circles, slow `loading.breathe` motion |
| Light rays | Landing hero only | Linear gradients at 4–8% opacity, fanning from the glow |
| Mesh / flow field | Landing + premium backgrounds | `src/components/ui/effects/FlowField.tsx` |

**Never**: tiled stock textures, glossy bevels, skeuomorphic materials, animated confetti.

## 6. Icons

- **Language**: `lucide-react`, consistent 1.5–2px stroke feel.
- **Sizing**: 16px controls · 20px tiles · 24px empty-state heroes.
- **Brand marks**: custom social icons (`social-icons.tsx`) — never stock logos.
- **Behavior**: 100% opacity default → +10% brightness hover → 50% disabled (see `MASTER.md` §9).

## 7. AI Visualization

AI is *visible* in ToneCraft — it has a material and a motion language:

- **Thinking state**: a controlled pulse on the composer/avatar (`ai.thinking`) + a short reasoning label. Never a bare spinner for generative work.
- **Streaming**: text appears with a subtle opacity shimmer (`ai.streaming`); the caret blinks gently.
- **Tool execution**: chips animate in (`ai.toolActivated`), expanding to an inline panel.
- **Tone applied**: the message surface flashes the tone color at 10% (`ai.contextUpdate`).

## 8. Depth & Shadows

- Elevation tokens: `elevation.sm → md → lg → xl → premium` (see `src/styles/elevation.ts`).
- **One elevation per surface type.** Cards `md`; floating panels `lg`; modal/drawer `xl`; hero/primary CTA `premium`.
- Shadows are soft and diffuse (`rgba(0,0,0,0.05–0.12)`) — never hard or colored (except the violet glow on active AI elements).
- Depth is *layered*: background < card < floating panel < modal. The eye should always know what's on top.

---

*Reference: `MASTER.md` §24–28, §31; `Creative-Direction.md`; implementations in `src/components/ui/effects/*`.*
