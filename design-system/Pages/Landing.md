# Landing Page Specification

**Route:** `/` (`src/app/page.tsx`)
**Layout:** No dashboard shell — full viewport
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

First impression for unauthenticated visitors. Demonstrates ToneCraft's core value: AI-powered tone transformation. Drives sign-ups and shows the product in action.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ NAVBAR (logo + links + CTA)                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ HERO                                             │
│  - Artistic canvas background                    │
│  - Animated cursor writing text                 │
│  - Words morphing (tone transformation)         │
│  - Headline (display) + subheadline (body-lg)    │
│  - Primary CTA button (brand gradient)           │
│                                                 │
├─────────────────────────────────────────────────┤
│ INTERACTIVE DEMO                                 │
│  - Embedded playground                           │
│  - Real-time tone preview                        │
├─────────────────────────────────────────────────┤
│ SOCIAL PROOF                                    │
│  - Testimonials (avatar cards, elevation-2)     │
├─────────────────────────────────────────────────┤
│ PRICING                                         │
│  - 3-tier card layout                           │
│  - Featured plan: elevation-3                   │
├─────────────────────────────────────────────────┤
│ CTA SECTION                                     │
│  - Gradient button (bg-gradient-to-r)          │
│  - elevation-glow                              │
├─────────────────────────────────────────────────┤
│ FOOTER                                          │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `Navbar` | `src/components/landing/Navbar.tsx` | Logo, nav links, sign-in/up |
| `Hero` | `src/components/landing/Hero.tsx` | Canvas, animated cursor, headline, CTA |
| `DynamicLandingSections` | `src/components/landing/DynamicLandingSections.tsx` | Demo, social proof, pricing, CTA |

---

## Data Requirements

- Static content (headlines, testimonials, pricing tiers)
- No user data required

---

## Interaction Notes

- Hero CTA → `/sign-up`
- Interactive demo shows tone transformation in real-time (no auth required to interact)
- All animations respect `prefers-reduced-motion`

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column, hero text stacks, CTA prominent above fold |
| Tablet (≥768px) | Two-column demo, pricing grid 2-up |
| Desktop (≥1024px) | Full hero, 3-column pricing grid |

---

## Design Tokens Used

- `display`, `body-lg` typography
- `base-bg`, `semantic-surface`, `semantic-accent` colors
- `elevation-2`, `elevation-3`, `elevation-glow` shadows
- Brand gradient: `from-violet-600 to-indigo-600`
- `radius-lg`, `radius-xl` for cards and hero panels
