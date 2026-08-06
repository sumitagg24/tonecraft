# Button Component Blueprint

## Purpose
Primary interactive element for all user actions in ToneCraft. Buttons are the main mechanism for triggering AI actions, navigating sections, and submitting forms.

## Variants

### Default
- Base: `inline-flex items-center justify-center gap-2 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50`
- Height: 44px minimum
- Padding: `px-6 py-3`
- Border radius: `radius-md` (8px)

### Primary (CTA)
- Background: Brand gradient (`bg-gradient-to-r from-violet-600 to-indigo-600`)
- Text: White (`text-white`)
- Shadow: `shadow-glow`
- Hover: Slight brightness increase
- **Only one primary CTA per view**

### Secondary
- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Hover: `hover:bg-secondary/80`
- No shadow

### Ghost
- Background: Transparent
- Text: `text-foreground`
- Hover: `hover:bg-muted hover:text-accent-foreground`
- No shadow, no border

### Glass
- Background: `bg-white/5`
- Border: `border border-white/10`
- Backdrop blur: `backdrop-blur-md`
- Text: `text-white`
- Shadow: `shadow-dock`
- Hover: `hover:bg-white/10`

### Gradient (Deprecated — use Primary instead)
- `bg-gradient-to-r from-violet-600 to-indigo-600`
- Reserved for legacy; use Primary CTA moving forward

## States

| State | Visual Behavior |
|-------|----------------|
| Default | Base styles above |
| Hover | `hover:-translate-y-0.5` for primary, `hover:bg-muted` for ghost |
| Active/Pressed | `active:scale-[0.98]` on all variants |
| Focus-Visible | `ring-2 ring-primary/30` with 2px offset |
| Disabled | `opacity-50 pointer-events-none` |
| Loading | Spinner replaces label, width stays stable |

## Loading State
- Show `Loader2` icon + "Loading..." text
- Keep button width stable (no layout shift)
- Disable interaction during loading

## Disabled State
- `opacity-50 pointer-events-none`
- Cursor changes to not-allowed
- Tooltip explaining why disabled (if applicable)

## Icon Buttons
- Minimum 44px × 44px target
- `aria-label` required
- `title` attribute for hover tooltip
- Icon size: 20px (`w-5 h-5`)

## Dark Mode
- All variants adapt via semantic tokens
- Glass variant uses higher opacity in dark mode for readability
- Shadows are softer in dark mode

## Mobile
- Full-width buttons on mobile (≤768px)
- Touch targets remain ≥ 44px
- Primary CTA stays prominent at top of viewport

## Anti-Patterns
- Never use gradient on non-CTA buttons
- Never have more than one primary CTA per view
- Never use disabled state without explaining why
- Never hide the loading state — always show progress