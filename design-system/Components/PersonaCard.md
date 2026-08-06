# PersonaCard Specification

**Component:** `PersonaPicker.tsx`, `PersonasLibraryPage.tsx` (`src/components/workspace/`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §11 (Components)

---

## Purpose

Displays an AI persona (custom or built-in) in the persona picker or library. Shows avatar, name, description, and optional voice preview capability.

---

## Anatomy

```
<PersonaCard>
├─ <PersonaAvatar>
│  └─ colored circle with initials/icon
├─ <PersonaInfo>
│  ├─ <PersonaName>    ← h5 (16px), semibold
│  ├─ <PersonaDesc>    ← body-sm (14px), muted, line-clamp-2
│  └─ <PersonaTone>    ← tone chip with accent color
├─ <PersonaStats>      ← (library view only)
│  └─ usage count + creation date
└─ <PersonaActions>    ← (library view only)
   ├─ [Settings/ Edit]
   └─ [Delete]
```

---

## Variants

| Variant | Layout | Usage |
|---------|--------|-------|
| `picker` | Compact, avatar + name only | Tone bar in composer |
| `library` | Full card with desc + actions | PersonasLibraryPage |
| `inline` | Minimal badge with color dot | Message headers |

---

## States

| State | Behavior |
|-------|----------|
| Default | Standard elevation (`elevation-1`) |
| Hover | `elevation-2`, actions fade in |
| Selected | `ring-2 ring-primary/30`, accent border |
| Active (picker) | Color dot pulses with tone color |
| Default badge | "Default" badge on system personas |

---

## Dimensions

- Avatar size: 32px (`w-8 h-8`) in picker, 48px in library
- Card min-height: 80px (picker), 120px (library)
- Border radius: `radius-lg` (12px)
- Avatar border-radius: `radius-full` (9999px)
- Tone dot: 6px diameter

---

## Spacing

| Element | Spacing |
|---------|---------|
| Picker: avatar to name | `space-2` (8px) |
| Library: avatar to info | `space-3` (12px) |
| Info vertical gap | `space-1` (4px) |
| Card internal padding | `space-4` (16px) |

---

## Tokens

- `semantic-surface` — card background
- `semantic-border` — card border
- `semantic-accent` — tone-specific colors (from tone-color mapping)
- `elevation-1`, `elevation-2` — shadows
- `radius-full` — avatar
- `radius-lg` (12px) — card corners
- `duration.fast` (200ms) — selection transitions

---

## Accessibility

- `aria-label` on persona: "{name} — {description}"
- Avatar: `aria-hidden="true"` if decorative, or `alt` text if meaningful
- Selected state: `aria-selected="true"`
- Keyboard: arrow keys navigate, Enter selects
- Color is not the only indicator — always includes text

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Picker becomes dropdown/sheet |
| Tablet (≥640px) | Inline horizontal scroll of cards |
| Desktop (≥1024px) | Grid layout (library), inline row (picker) |
