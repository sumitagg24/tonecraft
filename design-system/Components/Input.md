# Input Specification

**Component:** `Input` (`src/components/ui/input.tsx`)
**Tier:** Primitive
**Reference:** Design-System-v1.md §15 (Technical Implementation)

---

## Purpose

Text input fields for forms, search, and single-line text entry.

---

## Anatomy

```
<Input type="text" placeholder="..." />
┌─────────────────────────────────────────┐
│  border-border/40                        │
│  padding: space-3 (12px)                 │
│  height: 44px                            │
│  background: semantic-surface            │
│  [placeholder text]                      │
└─────────────────────────────────────────┘
```

---

## States

| State | Behavior |
|-------|----------|
| Default | `border-border/40`, transparent background |
| Focus | `ring-2 ring-primary/30`, `border-primary/50` |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Error | `border-semantic-error`, red focus ring |
| With value | Placeholder fades to `semantic-muted` |

---

## Spacing

- Height: 44px (minimum touch target)
- Internal padding: `space-3` (12px) horizontal, `space-2` (8px) vertical
- Label spacing: `space-2` (8px) below label
- Error text: `caption` (12px), `space-1` (4px) gap
- Full width by default

---

## Tokens

- `semantic-surface` — background
- `semantic-border` — border (default)
- `semantic-error` — error state border
- `semantic-muted` — placeholder text
- `radius-sm` (6px) — corner radius
- `duration.instant` (100ms) — focus transition

---

## Accessibility

- Associated `<label>` required (use `aria-label` if no visible label)
- `aria-invalid="true"` when in error state
- `aria-describedby` linking to error message
- Focus: visible `focus-visible` ring
- Placeholder contrast: ≥ 4.5:1 against background

---

## Responsive Behavior

- Full width (`w-full`) at all sizes
- On mobile, height stays 44px for touch usability
- Font size scales to prevent iOS zoom on focus (`text-base` on mobile)
