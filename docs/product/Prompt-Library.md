# Prompt Library — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.4.
> **Depends on:** Compose. A dead `PromptLibrary.tsx` component + prompt data
> already exist in the repo (orphaned); this spec resurrects them into a real,
> navigable library.

---

## 1. Purpose

Turn the prompt system from **static** into a **categorized, templated,
variable-driven** library:

```
Current:                     Target:
Static prompt list           Categories
                             ├── Marketing
                             ├── Business
                             ├── Resume
                             ├── Emails
                             └── Social
                             └── Templates → Variables → Preview → Run
```

Every prompt is reusable, parameterized, searchable, favoritable, and tracked
(recent + examples). It's the difference between "a list of strings" and a
real writing-workflow asset.

---

## 2. User flow

```
Library → Prompts
    │
    ├── Category sidebar (Marketing, Business, Resume, Emails, Social…)
    ├── Grid/list of templates (title, description, category, tags, preview)
    ├── Open template
    │    ├── Fill variables (form fields, validated)
    │    ├── Live preview (rendered prompt, token count)
    │    ├── Examples (input/output samples)
    │    ├── Favorite / Recent
    │    └── Run → sends to composer (or generates directly)
    └── Manage → create, edit, duplicate, delete, organize
```

### Variable flow

A template body uses `{{variable}}` placeholders:

```
Write a {{tone}} email to {{recipient}} announcing {{announcement}}. Keep it
under {{length}} words. Signature: {{signature}}
```

1. Library lists each unique variable → form inputs.
2. User fills values; validation (required, min/max length) runs per variable.
3. Preview renders the resolved prompt live as they type.
4. **Run** inserts the resolved prompt into the composer (existing send path),
   optionally applying the template's tone/persona.

---

## 3. Categories

| Category | Examples |
|---|---|
| Marketing | Launch announcement, promo email, social post, ad copy |
| Business | Follow-up, negotiation, cold outreach, internal memo |
| Resume | Summary, bullet point reframe, cover letter |
| Emails | Formal, friendly, apology, meeting request, thank-you |
| Social | LinkedIn post, X/Tweet, Instagram caption, thread |
| Support | Ticket reply, escalation, refund |
| Writing | Blog outline, headline, meta description |
| Custom | User-created categories |

Categories are tag-like (a prompt can belong to several) with a primary
category for the sidebar. Admin/catalog categories ship curated; user
categories are user-scoped.

---

## 4. Templates & variables

### Template model

```
id, title, description, category, tags[], body (with {{vars}}),
variables[] (definition), tone?, personaId?, example?, isOfficial, isFavorite,
createdBy, createdAt, updatedAt
```

### Variable definition

```json
{
  "name": "recipient",
  "label": "Recipient name",
  "type": "text" | "textarea" | "select",
  "required": true,
  "default": "",
  "options": ["Client", "Manager", "Team"],   // for select
  "maxLength": 200
}
```

### Examples

Each template may carry one or more `examples`: `{ variables: {...}, output }`
so users see a filled-in working sample before running it.

### Recent & favorites

- Recent: last-used templates (localStorage + server), capped.
- Favorites: starred templates (server-persisted), pinned section.
- Both follow the exact pattern used by the tone picker favorites/recent.

---

## 5. Running a prompt

1. **To composer:** resolved prompt text is dropped into the composer input
   (with the template's tone/persona applied). User edits freely, then sends.
2. **Generate directly:** prompt runs immediately as a message (same
   `sendMessage` path) with the template's tone/persona.
3. Both honor project scoping (8.2) and the active persona (8.3).

---

## 6. Database changes (design)

```prisma
model Prompt {
  id          String    @id @default(cuid())
  userId      String
  projectId   String?   // 8.2
  title       String
  description String?
  category    String
  tags        String[]  @default([])
  body        String
  variables   Json?     @default("[]")     // variable definitions
  examples    Json?     @default("[]")     // [{variables, output}]
  tone        String?
  personaId   String?
  isOfficial  Boolean   @default(false)    // curated catalog
  isFavorite  Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, category])
  @@index([userId, isFavorite])
  @@index([userId, projectId])
}
```

`isOfficial` templates are seeded per-user (copy-on-first-run) or referenced
from a read-only catalog table; MVP seeds curated rows per user to keep
permissions trivial.

---

## 7. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/prompts` | List (filter by category/tags/favorites/project/search) |
| POST | `/api/prompts` | Create template |
| GET | `/api/prompts/[id]` | Detail incl. variables + examples |
| PATCH | `/api/prompts/[id]` | Update |
| DELETE | `/api/prompts/[id]` | Delete |
| POST | `/api/prompts/render` | Resolve `{{vars}}` for a body + values (server-side, shared with preview) |
| GET | `/api/prompts/categories` | Category catalog |

`render` lives server-side so preview and run resolve identically (single
source of truth for templating).

---

## 8. Frontend architecture

- **`PromptLibrary`** — `/library/prompts`: category sidebar, search, grid/list
  toggle, favorites/recent sections.
- **`PromptCard`** — title, description, category, tags, favorite star, hover
  actions (Run, Edit, Duplicate).
- **`PromptEditor`** — modal: metadata + body editor with variable insertion
  chips (click a `{{var}}` to insert).
- **`PromptRunDialog`** — variable form + live preview + Run buttons.
- **`PromptRenderer`** — shared component for preview (client-side render of
  the server `render` result, or local interpolation for instant typing).
- **`usePrompts` hook + `prompts-store`** (zustand) — list/CRUD/favorites/recent.
- **Composer integration:** a "Prompt" toolbar entry opens the library filtered
  for insertion.

---

## 9. Security

- Prompts are user-scoped; `isOfficial` curated rows are read-only (no edit).
- Body length capped (e.g., 8,000 chars); variables length-capped.
- Rendered prompts are plain text dropped into the composer — no HTML
  injection surface; `render` returns text only.

---

## 10. Future improvements

- Prompt marketplace (community templates, gated by premium).
- Versioned templates (edit history per template).
- AI "improve this prompt" assistant.
- Team prompt libraries with locked official templates.
- Prompt analytics (which templates get run/favorited most).
- Batch run (apply template to multiple inputs).
