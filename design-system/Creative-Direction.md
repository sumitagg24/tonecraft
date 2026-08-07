# ToneCraft — Creative Direction

> Phase 2 · Zero code. Only design intent.
> This document describes how ToneCraft should *feel*. The rules that make it real live in `Visual-Identity.md`, `Art-Direction.md`, and `Motion.md`.

---

## 1. Mood

| Mood | Why |
|---|---|
| **Luxury** | The product treats your words as valuable material. Surfaces feel substantial, not cheap. |
| **Editorial** | Typography leads. Layouts breathe. The interface reads like a well-set magazine page. |
| **Minimal** | 80% neutral. Restraint is the default; color is earned. |
| **Confident** | Bold headlines, decisive actions, no apologetic micro-copy. |
| **Warm** | Indigo/violet accents on warm neutrals — creative, not clinical. |
| **Creative** | Voice is visible: tones have color, writing has personality. |
| **Premium** | Glass, soft depth, and restrained glow reserved for the moments that matter. |
| **Professional** | It must still feel like a serious tool for serious work. |

**Overall temperature: warm-neutral with an electric accent.** Not cold SaaS gray, not loud rainbow.

## 2. Inspiration Mix

```
60%  Editorial luxury   — Kinfolk, Aesop, premium print: whitespace, type-led hierarchy
20%  Apple              — precision, restraint, delightful micro-interactions
10%  Arc Browser        — confident command surface, keyboard-first, playful details
10%  Modern AI          — Claude/Linear-caliber polish: glass panels, streaming motion
```

## 3. Things We LOVE

- Lots of whitespace — density is a failure state, not a virtue
- Beautiful typography — Inter, tight tracking, strong size contrast
- Large cards — generous surfaces with real padding (`spacing-4`/`-6`)
- Glass — `backdrop-blur` surfaces with `bg-card/60` + `border-border/40`
- Subtle gradients — violet→indigo, used once, used well
- Animated backgrounds — slow-moving glow, flow fields, faint noise
- Depth — layered elevation, soft shadows, cards that lift on hover
- Soft shadows — `elevation.md`/`premium`; never hard drop shadows
- Motion — purposeful, fast, springy where it counts
- An *expensive* feeling — the interface should feel like it cost more than it did

## 4. Things We HATE

- **Bootstrap** — every generic, boxy, border-everything layout
- **Material UI** — shadow-depth overwhelm, canned components, dead flatness
- **Generic SaaS** — the interchangeable "Stripe clone" dashboard
- **Blue dashboards** — default-primary blue everywhere
- **Cramped layouts** — 16px-density grids, claustrophobic cards
- **Square cards** — no radius, no breathing room
- **Cheap gradients** — rainbow, neon-on-black, unearned color
- **Rainbow UI** — 6 accent colors fighting on one screen

## 5. The ToneCraft Difference

Most AI tools show you a **text box**. ToneCraft shows you a **voice control room**:

- The tone is *first-class UI* — chips, colors, and live previews, not a dropdown
- The canvas and the composer feel *crafted* — like a writing instrument, not a form
- AI output *breathes* — streaming text with a visible thinking state, not a spinner

**Test every screen against this question:**
*"If I removed the logo, could someone tell this is a writing tool for people who care about voice?"*

---

*Reference: `MASTER.md` §1–3, `Art-Direction.md`, `Visual-Identity.md`.*
