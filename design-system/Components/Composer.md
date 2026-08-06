# Composer Specification

**Component:** `PremiumComposer` (`src/components/workspace/PremiumComposer.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §10 (AI Interaction), §12 (Layout)

---

## Purpose

The message input area at the bottom of the chat interface. Includes the tone bar, text input/textarea, and send/stop controls. Shows AI processing state inline.

---

## Anatomy

```
<ToneBar>
├─ [ToneChip]     ← current tone with color indicator
├─ [PersonaChip]  ← optional, if persona selected
└─ [ModelChip]    ← current model display

<ComposerContainer>
├─ <textarea>      (multiline, auto-resize)
│  placeholder: "Message ToneCraft..." or "Ask anything..."
│  min-height: 44px
│  max-height: 240px
├─ <ComposerActions>
│  ├─ [KnowledgeAttach]  ← clip/paperclip icon
│  ├─ [Mention]          ← @persona trigger
│  ├─ [Divider]
│  └─ [SendButton] OR [StopButton]
│     SendButton: gradient or primary, disabled when empty
│     StopButton: red, animated when streaming
└─ <AISpeakingIndicator>  (when AI is processing)
   └─ 3-dot pulse + GradientPulse
```

---

## AI States in Composer

| State | Visual |
|-------|--------|
| Idle | Plain composer, SendButton enabled |
| Thinking | AIThinking 3-dot pulse below textarea |
| Streaming | Stop button (red), GradientPulse animation |
| Ready | SendButton enabled, tone bar active |

---

## Dimensions

- Min height: 44px (`min-h-[44px]`)
- Max height: 240px (`max-h-[240px]`)
- Container padding: `space-4` (16px)
- Border: `border-border/40`
- Focus ring: `ring-2 ring-primary/30`
- Background: `semantic-surface`
- Tone bar height: 36px (above composer)
- Textarea padding: `space-3` (12px) horizontal, `space-2` (8px) vertical

---

## Spacing

| Element | Spacing |
|---------|---------|
| Tone bar to composer | `space-2` (8px) |
| Composer container padding | `space-4` (16px) all sides |
| Textarea internal padding | `space-3` (12px) horizontal |
| Actions gap | `space-2` (8px) |
| Divider to send button | `space-2` (8px) |
| AI indicator gap | `space-3` (12px) |

---

## Tokens

- `semantic-surface` — composer background
- `semantic-border` — border
- `semantic-accent` — focus ring, tone indicator
- `semantic-primary` — send button
- `semantic-error` — stop button
- `radius-xl` (16px) — composer corner radius
- `duration.fast` (200ms) — send button hover
- `duration.normal` (350ms) — AI indicator transitions

---

## Accessibility

- `aria-label="Message input"` on textarea
- Placeholder text for context
- Send button: `aria-label="Send message"`, disabled when empty
- Stop button: `aria-label="Stop generation"` when streaming
- Tone bar: `aria-label="Current tone: {toneName}"`
- Keyboard: `Enter` to send, `Shift+Enter` for newline
- `aria-expanded` on KnowledgeAttach when panel open

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Full-width composer, tone bar compactly stacked |
| Desktop (≥768px) | Same as mobile but wider max-width |
| Focus Mode | Composer always visible, minimal chrome |
| Reduced motion | No AI indicator animations, instant transitions |
