# Button Specification

**Component:** `Button` (`src/components/ui/button.tsx`)
**Tier:** Primitive
**Reference:** Design-System-v1.md §11 (Components), §8 (Motion)

---

## Purpose

Standard interactive button for all user actions — primary CTAs, secondary actions, toggles, and icon-only controls.

---

## Anatomy

```
<Button variant="default" size="default">
  ┌─────────────────────────────────────────┐
  │  [icon?] [label] [spinner?]             │
  │  padding: space-4 (16px) horiz           │
  │  min height: 44px                        │
  │  min width: 44px (icon-only)             │
  └─────────────────────────────────────────┘
</Button>
```

---

## Variants

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | Solid fill, primary color | Primary actions |
| `gradient` | Brand gradient (`from-violet-600 to-indigo-600`) | Hero CTAs, premium actions |
| `outline` | Transparent fill, border | Secondary actions |
| `secondary` | Secondary color fill | Non-primary alternatives |
| `ghost` | Transparent, no border | Tertiary actions, subtle |
| `destructive` | Red fill | Destructive/irreversible actions |
| `link` | Text-only, no padding | Inline links |

---

## Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px | `space-2` (8px) | `sm` (14px) |
| `default` | 44px | `space-3/4` (12/16px) | `base` (16px) |
| `lg` | 56px | `space-6` (24px) | `lg` (18px) |
| `icon` | 44px | 0 (square) | — |

---

## States

| State | Behavior |
|-------|----------|
| Default | Base background/border |
| Hover | Scale 1.03, background shift |
| Active | Scale 0.98, shadow shift |
| Focus | `ring-2 ring-primary/30` with 2px offset |
| Disabled | `opacity-50`, `cursor-not-allowed`, no hover |
| Loading | Spinner replaces icon, `disabled` state |
| Icon-only | Must have `aria-label` |

---

## Spacing

- Minimum touch target: 44px × 44px
- Internal horizontal padding: `space-4` (16px) standard
- Gap between icon and label: `space-2` (8px)
- Border radius: `radius-md` (8px) standard, `radius-full` for icon variant

---

## Tokens

- `semantic-primary` — default variant fill
- `semantic-primary-foreground` — default variant text
- `semantic-border` — outline variant border
- `radius-md`, `radius-full` — corner radius
- `duration.instant` (100ms) — hover feedback
- `ease-default` — transition curve

---

## Accessibility

- Icon-only buttons: `aria-label` required
- Keyboard: `Enter` and `Space` activate
- Focus: visible `focus-visible` ring
- Loading: `aria-busy="true"` when loading
- Contrast: ≥ 4.5:1 for text on button surface

---

## Responsive Behavior

- Touch targets ≥ 44px at all breakpoints
- Text scales with type scale tokens
- On mobile, primary CTAs can take full width (`w-full`)
