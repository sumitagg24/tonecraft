# PromptCard Specification

**Component:** `PromptLibrary.tsx` (within `PromptLibraryPage`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §11 (Components)

---

## Purpose

Displays a saved prompt in the library grid. Shows title, preview content, category, and tone. User can click "Use" to load it into the composer.

---

## Anatomy

```
<PromptCard>
├─ <CardHeader>
│  ├─ <PromptIcon>      ← category icon (BookOpen, Code, etc.)
│  ├─ <PromptTitle>     ← h3 (font-medium)
│  └─ <PromptCategory>  ← badge/tag
├─ <CardContent>
│  └─ <PromptPreview>   ← body-sm, line-clamp-3
├─ <CardFooter>
│  ├─ <ToneIndicator>   ← colored dot + tone name
│  └─ <UseButton>       ← CTA button
```

---

## States

| State | Behavior |
|-------|----------|
| Default | Standard card elevation (`elevation-2`) |
| Hover | `elevation-3`, slight scale (1.01) |
| Selected | `border-primary`, `ring-1 ring-primary/30` |
| Loading | Skeleton placeholder (gray pulse) |
| Empty | Group hover highlight on "Use" |

---

## Dimensions

- Card width: Full (grid-constrained)
- Image/icon area: 40px × 40px if image present
- Card padding: `space-4` (16px)
- Title font: `h4` (20px) or `body` (16px) semibold
- Preview: `body-sm` (14px), line-clamp-3
- Tone dot: 6px diameter
- Use button: 36px height, `radius-md`

---

## Spacing

| Element | Spacing |
|---------|---------|
| Card internal padding | `space-4` (16px) |
| Header to content | `space-3` (12px) |
| Content to footer | `space-3` (12px) |
| Icon to title | `space-2` (8px) |
| Tone dot to label | `space-1` (4px) |

---

## Tokens

- `semantic-surface` — card background
- `semantic-border` — card border
- `semantic-accent` — category/tone colors
- `elevation-2` — default shadow
- `elevation-3` — hover shadow
- `radius-lg` (12px) — card corners
- `duration.fast` (200ms) — hover transitions

---

## Accessibility

- `aria-label` on Use button: "Use {promptTitle} prompt"
- Category badge: `aria-label` with category name
- Tone indicator: `aria-label` with tone name
- Focus: visible `focus-visible` ring on interactive elements
- Color is not the only indicator — text labels always present

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single column, full width |
| Tablet (≥640px) | Two-column grid |
| Desktop (≥1024px) | Three or four-column grid |
| All sizes | Card height auto-adjusts to content |
