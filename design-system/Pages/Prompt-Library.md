# Prompt Library Page Specification

**Route:** `/library` — Prompts tab (`src/app/(dashboard)/library/page.tsx`)
**Layout:** AppShell (standard dashboard layout, no ComposeWorkspace)
**Reference:** Design-System-v1.md §11 (Components)

---

## Purpose

Browse, search, and use saved prompts and prompt templates. Users can save prompts from the composer and reuse them across conversations.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Library Tab Bar                                 │
│  [ Prompts ] [ Personas ] [ Knowledge ]         │
│  (underline indicator on active tab)            │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ PageHeader: "Prompt Library" + description       │
│            [New Prompt button]                  │
│                                                 │
│ Search Bar                                      │
│  [🔍 Search prompts...]                          │
│                                                 │
│ Category Filter                                 │
│  [All] [Writing] [Code] [Marketing] [Creative]  │
│                                                 │
│ Prompt Grid                                     │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │ PromptCard│ │ PromptCard│ │ PromptCard│     │
│  │ • Title   │ │ • Title   │ │ • Title   │     │
│  │ • Preview │ │ • Preview │ │ • Preview │     │
│  │ [Use] btn │ │ [Use] btn │ │ [Use] btn │     │
│  └───────────┘ └───────────┘ └───────────┘     │
│                                                 │
│ Empty State: "No prompts match your search"    │
│  [ Clear filters ]                              │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `PromptLibraryPage` | `src/components/workspace/PromptLibraryPage.tsx` | Main prompts view |
| `PromptCard` | `src/components/workspace/PromptCard.tsx` | Saved prompt preview card |
| `PageHeader` | `src/components/suite/PageHeader.tsx` | Page title + primary action |
| `ToolCard` | `src/components/tools/ToolCard.tsx` | Card grid item (shared pattern) |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | No results state |

---

## Data Requirements

- `GET /api/prompts` — paginated list of saved prompts
- Each prompt: `id`, `title`, `description`, `content`, `category`, `tone`, `tags`, `isFavorite`, `createdAt`, `usedCount`
- Search filters by title, description, category, tags

---

## Interaction Notes

- **PromptCard "Use" button**: Opens Compose preloaded with the prompt template and tone
- **Save flow**: Composer → "Save to Library" → appears in Prompts tab
- **Category filter**: Pill-shaped buttons, active uses tone accent color
- **Search**: Instant filtering, clears when query is empty
- **Empty state**: "No saved prompts" → "New Prompt" CTA

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column grid, search below header |
| Tablet (≥768px) | Two-column grid |
| Desktop (≥1024px) | Three-column grid |
| Container | Max width 1280px (`max-w-5xl`) |

---

## Design Tokens Used

- `h1` for page title, `body-sm` for descriptions
- `semantic-surface` for card backgrounds
- `elevation-2` for cards
- `radius-lg` for card corners
- `radius-full` for category pills
- Brand gradient for primary CTA button
