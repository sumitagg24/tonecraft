# AI Response Component Blueprint

## Purpose
Displays AI-generated responses with visual state indicators that communicate what the AI is doing at every moment. This component is the primary interface for AI interaction in ToneCraft.

## Visual States

### Idle
- No special visual treatment
- Standard message bubble appearance
- No indicator or animation

### Thinking
- Cursor glows with tone accent color
- Subtle pulse animation (opacity 0.3→1.0, 2s cycle)
- 3-dot indicator appears below composer
- Dot animation: sequential pulse (dot1→dot2→dot3→dot1)
- Dot size: 6px diameter, 12px gap
- Color: Current tone accent

### Streaming
- Message bubble appears immediately with animated underline
- Underline expands from 0→100% width over the streaming duration
- Background: `bg-card/80` (slightly transparent)
- Border: `border-border/30` (reduced opacity)
- No shadow (reduced visual weight)
- Text reveals with 30ms stagger per line

### Reasoning
- Accent border shifts hue slowly (3s color cycle)
- Border color cycles through tone palette
- Subtle background shift (`bg-card` → `bg-card/90`)
- Communicates that the AI is processing complex logic

### Using Tool
- Tool icon spins gently (rotation 0→360°, 1s)
- Tool name appears as small label below message
- No disruption to message flow

### Using Knowledge
- Knowledge dots illuminate sequentially (100ms stagger)
- Each dot represents an attached knowledge source
- Dots are small (8px) and positioned near the message
- Hover on dot shows document name in tooltip

### Using Persona
- Persona avatar glows with ring animation (500ms)
- Ring expands from avatar edge with fade
- Color matches persona's assigned color

### Using Tone
- Tone chip expands slightly (scale 1.0→1.05, 200ms)
- Tone chip color shifts to match the active tone
- Subtle background transition (400ms ease)

### Finished
- Brief glow pulse on last message (300ms)
- Scale: 1.0→1.02→1.0
- Shadow returns to `shadow-card`
- Streaming underline disappears
- Timestamp appears

### Cancelled
- Message fades with reduced opacity (opacity 1.0→0.5)
- Transition: 300ms ease-in
- "Cancelled" label appears briefly
- Retry option appears

### Regenerated
- Old content fades out (200ms)
- New content fades in (300ms)
- Total transition: 500ms
- Subtle "Regenerated" indicator appears

### Comparing
- Side-by-side layout with draggable divider
- Old response on left, new response on right
- Divider slides smoothly on drag
- Toggle to switch between single/double view

## AI Response Card Structure
```
┌─────────────────────────────────────┐
│ [Avatar] AI Name    [Tone Chip]     │
│                                     │
│  Response text...                   │
│  (streaming: animated underline)    │
│                                     │
│ [Copy] [Regenerate] [Tone Again]    │
│ [Attach Knowledge] [Compare]        │
└─────────────────────────────────────┘
```

## Spacing Rules
- Avatar to text: `gap-3` (12px)
- Text to actions: `mt-4` (16px)
- Actions gap: `gap-2` (8px)
- Card padding: `p-4` (16px)

## Typography
- AI name: `body-sm` (14px), semibold, tone accent color
- Response text: `body` (16px), 1.5 line height
- Timestamp: `caption` (12px), `semantic-muted`
- Action labels: `caption` (12px)

## States Summary Table

| State | Visual Indicator | Animation | Duration |
|-------|-----------------|-----------|----------|
| Thinking | Cursor glow + 3 dots | Pulse | 2s cycle |
| Streaming | Animated underline | Width expand | Per message |
| Reasoning | Border hue shift | Color cycle | 3s cycle |
| Using Tool | Spinning icon | Rotation | 1s |
| Using Knowledge | Illuminating dots | Opacity stagger | Per dot |
| Using Persona | Avatar glow | Ring expand | 500ms |
| Using Tone | Chip scale | Scale pulse | 200ms |
| Finished | Glow pulse | Scale 1→1.02→1 | 400ms |
| Cancelled | Fade out | Opacity 1→0.5 | 300ms |
| Regenerated | Fade swap | Out 200ms + In 300ms | 500ms |
| Comparing | Side-by-side | Divider slide | — |

## Motion Rules
- All AI state transitions use `ease-default` or `ease-out`
- Streaming text reveals with 30ms stagger per line
- Never stack multiple loading indicators simultaneously
- Respect `prefers-reduced-motion` — replace all animations with instant state changes
- Exit animations always pair with entrance animations

## Dark Mode
- All colors adapt via semantic tokens
- Streaming background is slightly more transparent in dark
- Shadows are softer in dark mode

## Mobile
- AI response cards are full-width
- Inline actions collapse into a "More" menu
- Timestamp moves below actions
- Touch targets remain ≥ 44px