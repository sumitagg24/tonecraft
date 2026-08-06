# KnowledgeCard Specification

**Component:** `KnowledgeLibraryPage.tsx` (`src/components/workspace/`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §11 (Components)

---

## Purpose

Displays a knowledge document in the card grid. Shows file type, name, size, indexing status, and quick actions (link to chat, delete).

---

## Anatomy

```
<KnowledgeCard>
├─ <FileIcon>            ← type-specific (PDF, Word, Markdown, etc.)
├─ <FileContent>
│  ├─ <FileName>         ← h5 (16px), font-medium, truncated
│  ├─ <FileMeta>          ← body-sm (14px), muted
│  │  ├─ file size
│  │  └─ last modified date
│  └─ <StatusBadge>      ← pending/spinner, indexed/check, error/exclamation
├─ <LinkIndicator>       ← (if linked to chats)
│  └─ small badge with chat count
└─ <CardActions>         ← visible on hover
   ├─ [LinkButton]
   └─ [DeleteButton]
```

---

## States

| State | Behavior |
|-------|----------|
| Default | Standard elevation (`elevation-2`), border subtle |
| Pending | Spinner animation on file icon, status "Indexing..." |
| Indexed | Green check icon, status "Ready" |
| Error | Red exclamation icon, status "Processing failed" |
| Linked | Badge showing number of linked chats |
| Hover | Actions fade in, slight elevation increase |

---

## Dimensions

- Card: Full width in grid
- File icon: 32px (`w-8 h-8`)
- Card padding: `space-4` (16px)
- Card min-height: 80px
- Status dot: 8px (`h-2 w-2`)
- Border radius: `radius-lg` (12px)

---

## Spacing

| Element | Spacing |
|---------|---------|
| Icon to content | `space-3` (12px) |
| Name to meta | `space-1` (4px) |
| Card internal padding | `space-4` (16px) |
| Actions to content | `space-4` (16px) gap |

---

## Tokens

- `semantic-surface` — card background
- `semantic-border` — card border
- `semantic-success` — indexed status
- `semantic-warning` — pending status
- `semantic-error` — error status
- `semantic-info` — linked indicator
- `elevation-2` — default shadow
- `radius-lg` (12px) — card corners
- `duration.instant` (100ms) — hover actions

---

## Accessibility

- `aria-label` on file name: "File: {fileName}"
- Status badge: `aria-label="Status: Indexing"` etc.
- Linked badge: `aria-label="Linked to {count} chats"`
- Delete button: `aria-label="Delete {fileName}"` with confirmation
- Link button: `aria-label="Link to conversation"`
- Focus ring: `ring-2 ring-primary/30` on all interactive elements

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single column, actions always visible |
| Tablet (≥640px) | Two-column grid |
| Desktop (≥1024px) | Three or four-column grid, actions on hover only |
