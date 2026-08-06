# Card Component Blueprint

## Purpose
Container surface for grouping related content. Cards are the primary layout primitive for organizing information in ToneCraft.

## Variants

### Default Card
- Base: `rounded-2xl border border-border/50 shadow-card transition-all duration-300`
- Background: `bg-card`
- Padding: `p-6` (24px) standard, `p-4` (16px) for compact cards
- Border radius: `radius-lg` (12px)

### Glass Card
- Base: `rounded-2xl border border-border/50 shadow-card transition-all duration-300`
- Background: `bg-card/60 backdrop-blur-xl`
- Used for overlays and elevated surfaces

### Solid Card
- Base: Same as default
- Background: `bg-card` (no transparency)
- Used for primary content areas

### Interactive Card
- Inherits from Default Card
- Adds: `cursor-pointer hover:border-border/70 hover:shadow-lg hover:-translate-y-0.5`
- Hover lift: ≤4px (`-translate-y-0.5`)
- **Never animate layout-affecting properties** (height, margin) — use `transform` only

### Premium Card
- Inherits from Interactive Card
- Adds: `border-primary/20` with subtle gold accent
- Used for premium-tier content and upgrade prompts
- Shadow: `shadow-premium`

### Message Card (AI Response)
- Background: `bg-card` with `border border-border/40`
- Border radius: `radius-2xl` (20px) with `rounded-bl-sm`
- Shadow: `shadow-card`
- Hover: `hover:border-white/10` (dark mode)
- Streaming: `bg-card/80 border-border/30`
- Editing: `bg-muted/30 border-border/40`

## States

| State | Visual Behavior |
|-------|----------------|
| Default | Base styles above |
| Hover | Lift 4px + shadow increase (interactive only) |
| Active | Subtle scale down (0.98) |
| Focus-Visible | `ring-2 ring-primary/30` with 2px offset |
| Selected | Border accent color + subtle glow |
| Loading | Skeleton placeholder inside card |
| Empty | Illustration + descriptive text |

## Spacing Rules
- Internal padding: `space-y-4` (16px) between child elements
- Card-to-card gap: `space-6` (24px) in grids
- Card header: `space-y-2` (8px) between title and description
- Card footer: `border-t border-border/40 pt-4 mt-4`

## Typography in Cards
- Title: `h4` (20px, semibold)
- Description: `body-sm` (14px, regular)
- Metadata: `caption` (12px, muted)
- Actions: `body-sm` with interactive styling

## Dark Mode
- Cards use `bg-card` which maps to dark surface
- Borders use `border-border/50` which adapts to dark
- Shadows are softer in dark mode

## Mobile
- Cards become full-width on mobile
- Padding reduces to `p-4` on small screens
- Interactive cards maintain touch targets ≥ 44px

## Anti-Patterns
- Never stack more than 2 elevation levels in a single view
- Never use glow (`shadow-glow`) on non-CTA cards
- Never animate height or width on cards — use `transform` and `opacity`
- Never mix radius sizes within a single card