# PageHeader Specification

**Component:** `PageHeader` (`src/components/suite/PageHeader.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

Standardized page header that provides a consistent title, description, and primary action across all dashboard pages.

---

## Anatomy

```
<PageHeader>
├─ <HeaderContent>
│  ├─ <Title>           ← h1 (28px) or h2 (24px)
│  ├─ <Description>     ← body-sm (14px), muted
│  └─ <Icon>            ← optional leading icon
├─ [Spacer]
└─ <Actions>           ← optional, array of buttons
   └─ <Button /> × N
```

---

## Variants

| Variant | Title Size | Description | Actions | Usage |
|---------|-----------|-------------|---------|-------|
| `default` | h1 | Optional | Optional | Standard pages |
| `dense` | h2 | Hidden | Optional | Nested contexts |
| `with-action` | h1 | Optional | Required | Pages with primary CTA |
| `centered` | h1 | Optional | Optional | Centered layouts |

---

## Dimensions

- Title: h1 (28px, font-bold) or h2 (24px, font-semibold)
- Description: body-sm (14px)
- Icon: 20px (`w-5 h-5`)
- Padding: `space-4` (16px) horizontal, `space-6` (24px) vertical
- Action gap: `space-2` (8px) between buttons

---

## Spacing

| Element | Spacing |
|---------|---------|
| Title to description | `space-1` (4px) |
| Icon to title | `space-2` (8px) |
| Content to actions | Auto (flex spacer) |
| Section padding | `space-4` (16px) horizontal, `space-6` (24px) vertical |

---

## Tokens

- `semantic-text` — title text
- `semantic-muted` — description text
- `radius-md` (8px) — action button corners
- `duration.instant` (100ms) — action button hover

---

## Accessibility

- Title: rendered as `<h1>` (unless `dense` variant, then `<h2>`)
- `aria-label` on icon if decorative
- Action buttons: standard button accessibility
- Focus ring: `ring-2 ring-primary/30`
- Description: linked via `aria-describedby` when present

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Title font-size scales down, actions may collapse to overflow |
| Tablet (≥640px) | Full layout |
| Desktop (≥1024px) | Full layout with max width constraint |
