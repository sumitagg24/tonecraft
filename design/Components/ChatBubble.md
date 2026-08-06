# Chat Bubble Component Blueprint

## Purpose
Displays individual messages in the conversation thread. Chat bubbles are the core visual element of the chat workspace, distinguishing between user and AI messages.

## Variants

### User Message Bubble
- Background: `semantic-primary` (dynamic, follows tone accent)
- Text: `semantic-primary-foreground`
- Border radius: `radius-2xl` with `rounded-br-sm` (bottom-right sharp)
- Shadow: `shadow-glow` (subtle primary-keyed glow)
- Alignment: Right-aligned in thread
- Max width: 75% of thread width

### AI Message Bubble
- Background: `semantic-surface`
- Text: `semantic-text`
- Border: `border border-border/40`
- Border radius: `radius-2xl` with `rounded-bl-sm` (bottom-left sharp)
- Shadow: `shadow-card`
- Alignment: Left-aligned in thread
- Max width: 85% of thread width

### Streaming Message
- Background: `bg-card/80` (slightly transparent)
- Border: `border-border/30`
- Border radius: `radius-2xl` with `rounded-bl-sm`
- Animated underline at bottom (width expands 0→100%)
- No shadow (reduced visual weight during generation)

### Editing Message
- Background: `bg-muted/30`
- Border: `border-border/40`
- Border radius: `radius-2xl`
- Subtle visual distinction from normal messages

### Error Message
- Border-left: `border-l-4 border-l-semantic-error`
- Background: `semantic-surface`
- Contains retry button inline

## Spacing Rules
- Gap between messages: `space-y-4` (16px)
- Grouped messages (same sender): reduced to `space-y-2` (8px)
- First message in group: full spacing above
- Inline actions: `space-x-2` (8px) after message

## Typography
- Body text: `body` (16px, 1.5 line height)
- Timestamps: `caption` (12px), `semantic-muted`
- AI name label: `body-sm` (14px), semibold, tone accent color

## Inline Actions
- Copy, Regenerate, Tone Again
- Visible on hover/focus or tap (touch devices)
- Touch targets: ≥ 44px
- Icons: 20px (`w-5 h-5`)
- `aria-label` on all icon-only actions

## States

| State | Visual Behavior |
|-------|----------------|
| Default | Variant-specific styles above |
| Hover | Subtle background shift (user) or border highlight (AI) |
| Selected | Border accent color + subtle background change |
| Streaming | Animated underline, reduced shadow |
| Error | Error border-left, retry button visible |
| Editing | Muted background, editing indicator |

## Dark Mode
- User bubbles: primary background lightens slightly in dark
- AI bubbles: surface background lightens in dark
- All borders adapt via semantic tokens

## Mobile
- Bubbles expand to full width (max-width removed)
- Timestamps move below message
- Inline actions become bottom sheet on tap
- Touch targets remain ≥ 44px

## Anti-Patterns
- Never use the same bubble style for user and AI messages
- Never show timestamps inline with message text (always below)
- Never hide inline actions on touch devices (they must be reachable)
- Never use more than one shadow level on a message bubble