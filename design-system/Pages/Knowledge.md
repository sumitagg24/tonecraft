# Knowledge Library Page Specification

**Route:** `/library` — Knowledge tab (`src/app/(dashboard)/library/page.tsx`, `src/components/workspace/KnowledgeLibraryPage.tsx`)
**Layout:** AppShell (standard dashboard layout, no ComposeWorkspace)
**Reference:** Design-System-v1.md §11 (Components)

---

## Purpose

Manage reference documents (knowledge base) that can be attached to conversations. Users can upload documents, search their content, and link them to specific chats or personas.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Library Tab Bar                                 │
│  [ Prompts ] [ Personas ] [ Knowledge ]        │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ PageHeader: "Knowledge Base" + description     │
│            [Upload Document button]            │
│                                                 │
│ Search Bar                                      │
│  [🔍 Search knowledge...]                       │
│                                                 │
│ Knowledge Grid                                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │ Knowledge │ │ Knowledge │ │ Knowledge │     │
│  │ Card      │ │ Card      │ │ Card      │     │
│  │ • Icon    │ │ • Icon    │ │ • Icon    │     │
│  │ • Name    │ │ • Name    │ │ • Name    │     │
│  │ • Size    │ │ • Size    │ │ • Size    │     │
│  │ [Link]    │ │ [Link]    │ │ [Link]    │     │
│  └───────────┘ └───────────┘ └───────────┘     │
│                                                 │
│ Empty State: "No reference documents yet"      │
│  [ Upload a document ]                          │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `KnowledgeLibraryPage` | `src/components/workspace/KnowledgeLibraryPage.tsx` | Main knowledge view |
| `KnowledgeCard` | `src/components/workspace/KnowledgeCard.tsx` | Document preview card |
| `PageHeader` | `src/components/suite/PageHeader.tsx` | Title + upload action |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | No documents state |

---

## Data Requirements

- `GET /api/knowledge` — list of uploaded documents
- `POST /api/knowledge` — upload new document (multipart form)
- `DELETE /api/knowledge/{id}` — delete document
- `POST /api/knowledge/{id}/link` — link document to a chat
- Each document: `id`, `name`, `fileName`, `size`, `status` (indexed/pending/error), `createdAt`

---

## Interaction Notes

- **Upload**: File picker → document indexed for search
- **KnowledgeCard "Link"**: Opens context menu to attach to current or past conversations
- **Search**: Full-text search across document content
- **Status indicator**: Documents show indexing status (pending/spinner, indexed/check, error/exclamation)
- **Empty state**: "Upload a document" → opens file picker

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column grid |
| Tablet (≥768px) | Two-column grid |
| Desktop (≥1024px) | Three or four-column grid |
| Container | Max width 1280px (`max-w-5xl`) |

---

## Design Tokens Used

- `h1` for page title, `body-sm` for descriptions
- `semantic-surface` for card backgrounds
- `elevation-2` for cards
- `radius-lg` for card corners
- `semantic-success` for indexed status
- `semantic-warning` for pending status
- `semantic-error` for error status
