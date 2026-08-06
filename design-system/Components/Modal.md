# Modal / Dialog Specification

**Component:** `Dialog` (`src/components/ui/dialog.tsx`)
**Tier:** Primitive (Radix UI Dialog)
**Reference:** Design-System-v1.md §15 (Technical Implementation), §14 (Accessibility)

---

## Purpose

Overlay surfaces for focused tasks — confirmations, forms, detailed views, and error states. Use sparingly; prefer inline panels for simple actions.

---

## Anatomy

```
<Dialog>
├─ <DialogTrigger>    (button that opens)
├─ <DialogContent>
│  ├─ <DialogHeader>
│  │  ├─ <DialogTitle>    h3 (20px), font-semibold
│  │  └─ <DialogDescription> body-sm (14px), muted
│  ├─ [children]      dialog body
│  ├─ <DialogFooter>  (optional) action buttons
│  └─ <X>             close button (top-right)
└─ <DialogOverlay>   backdrop (click to close)
```

---

## Sizes

| Size | Width | Max Width |
|------|-------|-----------|
| `sm` | 90% | 384px |
| `md` | 90% | 512px |
| `lg` | 90% | 768px |
| `xl` | 90% | 1024px |
| `2xl` | 90% | 1280px |
| `fullscreen` | 100vw | 100vh |

Default: `md` (512px)

---

## States

| State | Behavior |
|-------|----------|
| Closed | Not in DOM (or `display: none`) |
| Opening | Fade in + scale up (350ms ease-out) |
| Open | Content visible, overlay active |
| Closing | Fade out + scale down (200ms ease-in) |
| Escape key | Closes dialog |
| Overlay click | Closes dialog |

---

## Spacing

- Content padding: `space-6` (24px)
- Header padding: `space-6` (24px)
- Footer padding: `space-6` (24px)
- Close button: 8px from top-right corner
- Gap between title and description: `space-2` (8px)

---

## Tokens

- `semantic-surface` — background
- `semantic-border` — border
- `elevation-4` — shadow
- `radius-lg` (12px) — corner radius
- `duration.slow` (500ms) — open animation
- `duration.fast` (200ms) — close animation
- `ease-out` — entrance, `ease-in` — exit

---

## Accessibility

- Focus trap (Tab cycles within dialog)
- Escape key closes
- `aria-labelledby` → DialogTitle
- `aria-describedby` → DialogDescription
- Initial focus on first interactive element
- Return focus to trigger on close
- `role="dialog"` `aria-modal="true"`
- Overlay click closes (not on content click)

---

## Responsive Behavior

- Mobile: full-width (90vw), rounded corners preserved
- Desktop: fixed max-width per size variant
- On mobile, `fullscreen` size may auto-trigger for small screens
