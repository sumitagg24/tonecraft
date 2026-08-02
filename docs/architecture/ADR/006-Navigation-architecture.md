# ADR-006: Navigation Architecture

## Status
Accepted

## Context
The application must expose a consistent global navigation map while preserving context across views. Users navigate between Write, Tools, Library, Search, and Account contexts.

## Decision
Use **Next.js App Router** with a persistent rail layout (`src/app/(dashboard)/layout.tsx`). The rail contains five labeled destinations ordered by frequency:
- **Compose** (W) — Chat and composer surface (home)
- **Tools** (T) — Single-purpose AI actions
- **Library** (L) — Prompts, Tones, Knowledge
- **Search** (S) — Global retrieval
- **Account** (▷) — Profile, Billing, Usage

Dynamic project scoping occurs within Compose via project filters, not separate routes.

## Evidence
- **Layout**: `src/app/(dashboard)/layout.tsx` renders the persistent rail
- **Route Mapping**: INFORMATION-ARCHITECTURE.md defines the sitemap (pages 109-126)
- **Rail Components**: `WorkspaceLayout` in `src/components/shell/WorkspaceLayout.tsx`
- **No workspace ID routes**: Projects are scoped within existing routes, not `/workspace/[id]`

## Alternatives Considered
1. **Pages Router** — Would lose nested layouts and App Router benefits
2. **Workspace routes** — Rejected; projects scope data within existing rail slots

## Tradeoffs
- **Pro**: Persistent rail provides contextual awareness; 1:1 mobile tab mapping
- **Con**: Mode switcher affects density but not navigation destinations

---

# ADR-007: Workspace Architecture

## Status
Accepted (Projects as workspace containers)

## Context
Users need to organize their work—conversations, prompts, personas, and knowledge—into logical groups. The architecture calls this "workspace" but the implementation uses **Projects**.

## Decision
Represent workspaces as **Project containers** modeled in `prisma/schema.prisma` (Project model). Projects provide:
- Hierarchical organization (tree structure with `parentId`)
- Scoping for all entity types (chats, prompts, personas, knowledge)
- Member management for collaboration

Projects exist as data entities, not URL segments. Navigation remains within the 5-rail structure; project context is a filter in the sidebar.

## Evidence
- **Model**: `model Project` in `prisma/schema.prisma` (lines 193-217)
- **Service**: `src/services/ProjectService.ts` provides CRUD, `moveChat()`
- **Repository**: `src/repositories/ProjectRepository.ts` handles data operations
- **API Routes**: `/api/projects` (routes 9), `/api/projects/[id]/chats`
- **UI**: `ProjectTreeSidebar` component with Unfiled support
- **No `/workspace/[id]` routes**: Projects scope data via `projectId` foreign key

## Alternatives Considered
1. **Separate workspace routes** — Rejected; would break rail persistence
2. **Flat project list only** — Rejected; would reduce discoverability

## Tradeoffs
- **Pro**: Projects integrate with existing 5-rail architecture; no new navigation paradigm
- **Con**: Limited to single project context; multi-project switch not yet implemented

---

# ADR-008: Knowledge System

## Status
Partial — Upload and storage implemented; retrieval and citations planned