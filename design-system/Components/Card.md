# Card Specification

**Component:** `Card` (`src/components/ui/card.tsx`)
**Tier:** Recipe
**Reference:** Design-System-v1.md §7 (Elevation), §6 (Radius)

---

## Purpose

Container surface for grouping related content — metrics, forms, lists, and data displays.

---

## Anatomy

```
<Card>
├─ <CardHeader>    (optional) padding: space-6 (24px)
│  ├─ <CardTitle>   h3 (24px), font-semibold
│  └─ <CardDescription> body-sm (14px), muted
├─ <CardContent>           padding: space-6 (24px)
│  └─ [children]
└─ <CardFooter>    (optional) padding: space-6 (24px)
```

---

## Variants

| Variant | Elevation | Border | Background | Usage |
|---------|-----------|--------|------------|-------|
| `default` | `elevation-2` | `border-border/20` | `semantic-surface` | Standard cards |
| `elevated` | `elevation-3` | None | `semantic-elevated` | Prominent surfaces |
| `flat` | `elevation-0` | `border-border/20` | `semantic-surface` | Inline cards |
| `premium` | `elevation-2` + gold border | `border-primary/20` gold | `semantic-surface` | Premium-tier indicators |

---

## States

| State | Behavior |
|-------|----------|
| Default | Base elevation, standard border |
| Hover | `elevation-3`, slight scale (1.01) |
| Selected | `border-primary`, `ring-1 ring-primary/30` |
| Loading | Skeleton placeholders inside |
| Interactive | Hover cursor, click ripple |

---

## Spacing

- Header/Footer padding: `space-6` (24px)
- Content padding: `space-6` (24px)
- Gap between header and content: `space-4` (16px)
- Title margin: 0
- Description margin: `space-1` (4px) below title

---

## Tokens

- `semantic-surface` — background
- `semantic-border` — border
- `elevation-2`, `elevation-3` — shadows
- `radius-lg` (12px) — corner radius
- `duration.normal` (350ms) — hover transition
- `ease-default` — transition curve

---

## Accessibility

- `role="region"` with `aria-labelledby` when CardTitle present
- Focusable cards have `focus-visible` ring
- Semantic HTML: `<section>` or `<article>` when appropriate

---

## Responsive Behavior

- Full width by default (`w-full`)
- Padding adjusts: `space-4` (16px) on mobile, `space-6` (24px) on desktop
- Grid cards stack to single column on mobile
