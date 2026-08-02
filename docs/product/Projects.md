# Projects — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.2 (after Knowledge Base).
> **Depends on:** 8.1 (files live inside projects), Prompt Library (prompts are
> project assets), Compose (chats belong to projects).

---

## 1. Purpose

Replace a flat list of 200 chats with logical folders. Instead of:

```
200 chats
```

Users get a tree:

```
Marketing
    ├── LinkedIn
    ├── Twitter
    ├── Ads
Sales
Support
Resume
Personal
Company
```

Every project is a self-contained workspace holding **chats, files, prompts,
personas, and settings**. Projects are the organizing spine of the product —
search, sharing, export, and notifications all key off them.

---

## 2. User flow

```
Sidebar (Projects tree)
    │
    ├── Create project (name, emoji, color)
    ├── Open project → project view
    │        ├── Chats (threads scoped to the project)
    │        ├── Files (Knowledge, project-scoped)
    │        ├── Prompts (project prompt library)
    │        ├── Personas (project personas)
    │        └── Settings (members, permissions, name, archive)
    ├── Collapse / expand tree
    ├── Drag chat or file into a project
    └── Share project (Phase 8.7)
```

**Routing:** `/p/[projectId]` hosts the project workspace; `/p/[projectId]/chats/[chatId]`
opens a chat inside a project. The composer, sidebar, and search all respect
the active project scope.

---

## 3. Folder hierarchy

- **Project** = top-level unit (e.g., "Marketing").
- **Nested folders** = optional sub-folders inside a project (e.g., "LinkedIn",
  "Twitter"). MVP: **one level of sub-folders** inside a project; deeper
  nesting is a later phase.
- **"All chats" / "Unfiled"** pseudo-folder at the root for chats with no
  project — keeps the migration path smooth and never hides old data.
- Projects are user-scoped in MVP; team/workspace projects come with 8.7.

### Hierarchy model

```
User
 └── Projects (top-level)
      ├── Chats
      ├── Folders
      │    ├── Chats
      │    └── Files
      ├── Files (Knowledge)
      ├── Prompts
      └── Personas
```

---

## 4. Chats inside projects

- A chat has exactly one `projectId` (nullable = "Unfiled").
- Moving a chat = updating `projectId` (no data migration of messages).
- Composer launched from a project pre-fills the project's default persona,
  tone, and knowledge grounding set.
- Chat list within a project is filtered by `projectId`; the "All chats" view
  is the union across projects.
- Keyboard-first: type-ahead jump between chats *within the current project*.

---

## 5. Files (Knowledge)

- `KnowledgeFile` gains `projectId` (see Knowledge-System.md §10).
- Files inherit the project's access scope: a project file is visible only to
  project members.
- Retrieval scope: when composing inside a project, grounding defaults to that
  project's files; the user can narrow to specific files or widen to all.
- Reusing a file across projects copies the row (cheap; chunks shared by
  content hash) or links it — decision deferred to implementation; MVP = move
  only, duplication later.

---

## 6. Personas in projects

- Personas can be project-scoped (`projectId` on `Persona`) or global.
- Project view shows: global personas + project personas; project personas
  appear only within the project.
- Default persona per project (selected when opening the project composer).
- Phase 8.3 owns the full persona feature; Projects only adds scoping.

---

## 7. Prompt libraries in projects

- Prompts can be project-scoped or global (mirrors personas).
- Project prompt library = filtered view of the global library + project
  prompts, with project-level categories.
- Phase 8.4 owns the prompt feature; Projects adds scoping + a "project
  templates" tab.

---

## 8. Project search

- Search within a project scopes results to that project's chats, messages,
  files, prompts, personas, folders.
- Global search (8.5) includes a `project:` filter and surfaces the project
  name on every hit.
- Search respects the same permissions as the project (a shared project's
  content is searchable by members only).

---

## 9. Sharing & permissions (foundation; full impl in 8.7)

MVP (8.2) ships **personal projects only** — no sharing yet. But the data
model must anticipate it:

- `ProjectMember` table with a `role` enum: `owner | editor | commenter | viewer`.
- Read-only share → comments → edit arrives in 8.7.
- Invite link is a signed, expirable token; membership is explicit, never
  implicit.

| Role | View | Comment | Edit chats | Manage files | Manage project |
|---|---|---|---|---|---|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✓ | — |
| Commenter | ✓ | ✓ | — | — | — |
| Viewer | ✓ | — | — | — | — |

---

## 10. Database changes (design)

```prisma
model Project {
  id          String          @id @default(cuid())
  userId      String          // owner
  name        String
  emoji       String?
  color       String          @default("#6366F1")
  description String?
  parentId    String?         // nested folder (one level, MVP)
  parent      Project?        @relation("ProjectTree", fields: [parentId], references: [id])
  children    Project[]       @relation("ProjectTree")
  archived    Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  chats       Chat[]
  files       KnowledgeFile[]
  members     ProjectMember[]

  @@index([userId, parentId])
  @@index([userId, archived])
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      String   @default("viewer") // owner|editor|commenter|viewer
  createdAt DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}
```

`Chat` gains `projectId String?` (+ index); `KnowledgeFile` gains `projectId`;
`Persona` and `Prompt` gain optional `projectId`.

---

## 11. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/projects` | List user's projects + folders |
| POST | `/api/projects` | Create project/folder (`parentId` optional) |
| GET | `/api/projects/[id]` | Project detail + member roles |
| PATCH | `/api/projects/[id]` | Rename, emoji, color, archive |
| DELETE | `/api/projects/[id]` | Delete project (soft-archive; chats → Unfiled) |
| POST | `/api/projects/[id]/chats` | Create chat inside project |
| PATCH | `/api/chats/[chatId]` | (extended) move chat between projects |
| GET | `/api/projects/[id]/files` | Project-scoped knowledge files |
| GET | `/api/projects/[id]/search` | Project-scoped search |
| POST | `/api/projects/[id]/invite` | (8.7) generate invite link |
| GET | `/api/projects/[id]/members` | (8.7) list/roles |

All endpoints enforce ownership via `auth()`; project membership checks added
in 8.7.

---

## 12. Frontend architecture

- **`ProjectSidebar`** — replaces/augments the conversation sidebar: project
  tree (collapsible), folder chevrons, "Unfiled" pseudo-folder, per-project
  active state, drag-to-move for chats.
- **`ProjectView`** (`/p/[projectId]`) — project home: tabs for Chats, Files,
  Prompts, Personas, Settings; mirrors the library layouts.
- **`ProjectHeader`** — emoji + name + member count + share button (8.7).
- **`useProjects` hook + `projects-store`** (zustand) — tree state, current
  project, optimistic create/move/archive.
- Routing lives under `/p/[projectId]`; the old `/chat` routes remain the
  "Unfiled" workspace so nothing breaks.
- Drag & drop: native HTML5 DnD for moving chats/files between projects (keep
  it simple; no drag lib in MVP).

---

## 13. Future roadmap

- Deeper nesting (3+ levels) with virtualization.
- Team/workspace projects with org membership (Clerk orgs).
- Project templates ("start a Marketing project with chats, personas, prompts,
  and knowledge pre-loaded").
- Project-level analytics (words, generations, credits per project).
- Project export (entire project → archive).
- Starred/pinned projects; project sorting by activity.
- Cross-project references and shared folders.
