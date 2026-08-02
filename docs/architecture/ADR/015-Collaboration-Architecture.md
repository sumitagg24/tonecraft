# ADR-015: Collaboration Architecture

## Status
Planned (Data Models Only)

## Context
Teams need to share projects, invite members with roles (viewer/editor/admin), comment on messages, and view edit history for compliance and co-authoring.

## Decision
Build collaboration on top of the existing `Project` container using a permission model.

**Components:**
- **Project Membership** — `ProjectMember` model (projectId, userId, role: 'viewer'|'editor'|'admin') already in schema.
- **Invites** — `Invite` model (projectId, email, role, token, expiresAt, acceptedAt) — to be added via migration.
- **Comments** — `Comment` model (id, userId, messageId, content, createdAt, updatedAt) exists; threading via self-referential `parentId` planned.
- **Permissions** — Middleware `requireProjectRole(projectId, ['editor','admin'])` on mutating routes.
- **Sharing** — `ShareLink` model supports read-only links with expiry/revoke.
- **Real-time** — SSE or WebSocket for live presence/cursors (deferred to Phase 10).

## Alternatives Considered
1. **Google Docs-style OT/CRDT** — Overkill; commenting + version history covers 90% of needs.
2. **Third-party (Liveblocks, PartyKit)** — Adds cost; native SSE + Postgres is sufficient for MVP.
3. **Project-level only, no message comments** — Comments are high-value for review workflows; keep.

## Tradeoffs
- **Pro**: Reuses Project container; granular roles; audit trail via comments + version history.
- **Con**: Real-time sync complexity; invite flow needs email delivery (SendGrid/Resend); permission checks on every query.

## Consequences
- New migration adds `Invite` model and `Comment.parentId` for threading.
- API routes: `/api/projects/[id]/invite`, `/api/projects/[id]/members`, `/api/comments/*`.
- UI: `ShareDialog` (upgrade), `CommentThread` component, member management panel.
- All project-scoped queries filter by `ProjectMember` membership.

## Evidence
- **Models**: `ProjectMember` in `prisma/schema.prisma` (lines 219-230), `Comment` (lines 405-416), `ShareLink` (lines 370-385)
- **Services**: `src/services/ProjectService.ts` (has `listMembers`, `addMember` stubs)
- **API Routes**: `src/app/api/projects/[id]/invite/route.ts`, `src/app/api/projects/[id]/members/route.ts` (planned), `src/app/api/comments/route.ts` (planned)
- **UI**: `src/components/shared/CommentThread.tsx` (stub), `src/components/shell/ShareDialog.tsx` (stub)