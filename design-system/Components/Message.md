# Message Specification

**Component:** `PremiumMessageCard` / `ChatMessage` (`src/components/workspace/PremiumMessageCard.tsx`, `src/components/chat/ChatMessage.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §10 (AI Interaction), §12 (Layout)

---

## Purpose

Renders individual chat messages in the conversation flow. Handles both user and AI messages, with distinct visual treatments for each role. Shows AI processing states (streaming, thinking).

---

## Anatomy

```
<Message role="assistant">
├─ <MessageHeader>
│  ├─ <Avatar>           ← AI persona icon or user avatar
│  ├─ <Name>             ← sender name
│  ├─ <ToneChip>         ← (AI only) current tone indicator
│  └─ <Timestamp>        ← caption (12px), muted
├─ <MessageContent>
│  └─ [text content]     ← markdown-rendered
├─ <StreamingUnderline>   (AI streaming only)
│  └─ Animated width 0→100%
├─ <InlineActionRing>     (appears on hover/focus)
│  ├─ [Copy]
│  ├─ [Regenerate]  ← (AI only)
│  ├─ [Like]
│  ├─ [Dislike]
│  └─ [Delete]
└─ <ErrorFallback>        (stream errors)
   └─ "Retry" + "Regenerate" buttons
```

---

## Variants by Role

| Role | Background | Border | Radius | Elevation |
|------|-----------|--------|--------|-----------|
| `user` | `semantic-primary` | None | `radius-2xl` + `rounded-br-sm` | None |
| `assistant` | `semantic-surface` | Tone accent (4px left) | `radius-2xl` + `rounded-bl-sm` | `elevation-2` |
| `assistant.streaming` | `bg-card/80` (transparent) | Tone accent (60% opacity) | Same | None |
| `assistant.error` | `semantic-surface` | `semantic-error` (4px left) | Same | `elevation-2` |

---

## States

| State | Behavior |
|-------|----------|
| Default | Full opacity, standard elevation |
| Hover | InlineActionRing fades in |
| Streaming | Animated underline, slightly transparent bg, `elevation-glow` |
| Error | Red border-left, retry button visible |
| Grouped | Reduced top margin (`space-2` instead of `space-4`) |
| Regenerating | Old content fades out (200ms), new content fades in (300ms) |

---

## Spacing

- Between messages: `space-y-4` (16px)
- Grouped messages (same sender, consecutive): `space-y-2` (8px)
- Header to content: `space-3` (12px)
- Content padding: `space-4` (16px)
- InlineActionRing: absolutely positioned at top-right of message
- Streaming underline: 2px height, 0→100% width

---

## Tokens

- `semantic-primary` — user message background
- `semantic-surface` — AI message background
- `semantic-accent` — tone accent border-left
- `semantic-error` — error state
- `semantic-muted` — timestamp text
- `radius-2xl` (20px) — message bubble radius
- `elevation-2` — AI message shadow
- `elevation-glow` — streaming/active state glow
- `duration.normal` (350ms) — streaming animation
- `duration.instant` (100ms) — action ring hover

---

## Accessibility

- `role="article"` for each message
- `aria-label` on inline action buttons (Copy, Regenerate, Like, etc.)
- Touch targets ≥ 44px for inline actions
- Focus ring on action buttons: `ring-2 ring-primary/30`
- Timestamp: visually hidden from screen readers or uses `<time>` element
- Markdown content: proper heading hierarchy, list semantics
- Error state: `role="alert"` for error messages

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Content max-width 90vw, inline actions in compact row |
| Tablet (≥640px) | Standard bubble width |
| Desktop (≥1024px) | Content max-width 640px (`max-w-2xl`) centered in container |
| Reduced motion | No streaming underline animation, instant state changes |
