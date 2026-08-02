# Implementation Plan — Phase 8 (M1 … M18)

> **Status:** Design only — no implementation.
> **Input:** all specs in `docs/product/` (Product-Roadmap, Knowledge-System,
> Projects, Personas, Prompt-Library, Search, Export-System, Notifications,
> Offline).
>
> Development is split into **small, independently verifiable milestones**.
> Every milestone is a commit + tag that leaves the app buildable. Milestones
> are ordered by dependency; each one lists goal, files, frontend/backend/DB/API
> work, testing, branch, tag, rollback, dependencies, and success criteria.

## Conventions used across all milestones

- **Branch naming:** `phase-8.<m>` (e.g., `phase-8.1`, `phase-8.2`).
- **Tag naming:** `phase-8.<m>-complete`.
- **Rollback strategy (default):** revert the merge commit; the previous tag is
  the restore point. Because every milestone is additive + buildable, rollback
  is a single `git revert`.
- **DB migrations:** each milestone ships a Prisma migration; rollback uses
  `prisma migrate` down + the reverted deploy.
- **Verification gate for every milestone:** `npx tsc --noEmit`, `npm run
  lint`, `npm run build` all pass; the milestone's manual test checklist runs.

---

## M1 — Knowledge: schema + upload (foundation)

- **Goal:** `KnowledgeFile` + `KnowledgeChunk` + `KnowledgeJob` tables; upload
  persists files and enqueues an indexing job. No embeddings yet.
- **Files:** `prisma/schema.prisma`, `src/app/api/knowledge/route.ts`,
  `src/repositories/KnowledgeRepository.ts`, `src/services/KnowledgeService.ts`
  (job enqueue), `src/app/api/knowledge/[id]/route.ts`.
- **Frontend:** minimal — upload dropzone stub + status list
  (`KnowledgeLibrary` skeleton). **Backend:** upload → R2 → row → job.
- **Database:** 3 new models + `pgvector` extension setup.
- **API:** `POST /api/knowledge`, `GET /api/knowledge`, `GET/DELETE
  /api/knowledge/[id]`.
- **Testing:** upload TXT/PDF/DOCX happy path; reject bad type/size/over-quota;
  status transitions; R2 object exists.
- **Branch/tag:** `phase-8.1` / `phase-8.1-complete`.
- **Rollback:** revert commit; `migrate down`.
- **Dependencies:** none (uses existing `/api/upload` patterns + R2).
- **Success:** files list, statuses persist, quota enforced, build green.

## M2 — Knowledge: extract + embed + index

- **Goal:** background job extracts text, chunks, embeds, stores vectors;
  status → READY/FAILED.
- **Files:** `src/services/KnowledgeIndexer.ts` (extract/chunk/embed),
  `src/services/EmbeddingService.ts`, worker poller (cron/route),
  `src/lib/parsers.ts` (pdf/docx/md/txt).
- **Frontend:** status badges + reindex + delete with chunks.
- **Database:** populate `KnowledgeChunk` with `vector`; `KnowledgeJob` lifecycle.
- **API:** extend `GET /api/knowledge/[id]` (chunkCount, status); `POST
  /api/knowledge/[id]/reindex`.
- **Testing:** chunk boundaries; embedding batch; READY on success; FAILED on
  no-text; retry with backoff; vector persisted (pgvector query sanity).
- **Branch/tag:** `phase-8.1b` / `phase-8.1b-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M1.
- **Success:** a file reaches READY with inspectable chunks; failure paths
  surface honest errors.

## M3 — Knowledge: RAG context injection + citations

- **Goal:** grounding in compose; retrieved chunks injected; `[n]` citations.
- **Files:** `src/engine/ContextBuilder.ts` (knowledge block),
  `src/services/KnowledgeRetriever.ts` (embed query + top-k),
  `src/app/api/chats/[chatId]/messages/route.ts` (accept `knowledgeFileIds`),
  `src/components/workspace/PremiumMessageCard.tsx` (citation chips),
  `MessageKnowledge` link model.
- **Frontend:** `MessageKnowledgeChips`, composer knowledge toggle.
- **Database:** `MessageKnowledge` link table; optional `MessageKnowledgeChunkRef`.
- **API:** extend message POST; `POST /api/knowledge/search`.
- **Testing:** grounding on/off; k + threshold cutoffs; citation correctness;
  "no relevant knowledge" honest path; sources shown.
- **Branch/tag:** `phase-8.1c` / `phase-8.1c-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M2.
- **Success:** "Write an email following our company policy" answers from the
  uploaded doc with citations.

## M4 — Personas 2.0: schema + CRUD + picker

- **Goal:** upgrade `Persona` (tone/temp/emoji/style/platformDefaults),
  `User.defaultPersonaId`; picker with curated/favorites/recent; editor.
- **Files:** `prisma/schema.prisma` (migrate Persona), `src/app/api/personas/*`,
  `src/repositories/PersonaRepository.ts`, `PersonaPicker.tsx`,
  `PersonaEditor.tsx`, `PersonaLibrary` page, `chat-store` wiring
  (`selectedPersona` → context).
- **Frontend:** picker popover (reuse `PickerSurface`), editor with live
  preview. **Backend:** CRUD + curated catalog + import/export.
- **Database:** new Persona columns; `User.defaultPersonaId`.
- **API:** full `/api/personas` set + `/api/personas/import` + `/export` +
  `/curated`.
- **Testing:** CRUD; default persistence; favorites/recent; platform-default
  precedence; import validation; persona → composer reconfig.
- **Branch/tag:** `phase-8.3` / `phase-8.3-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** none (independent; closes the known `selectedPersona` gap).
- **Success:** choosing a persona reconfigures tone/temp/emoji/platform;
  personas persist across devices.

## M5 — Prompt Library: schema + CRUD + variables

- **Goal:** `Prompt` model; categorized library; variable templating + render;
  favorites/recent; run-to-composer.
- **Files:** `prisma/schema.prisma`, `/api/prompts/*`, `PromptLibrary` page
  (resurrect dead component), `PromptEditor`, `PromptRunDialog`,
  `PromptRenderer`, `usePrompts`.
- **Frontend:** category sidebar, grid/list, variable form + live preview.
  **Backend:** CRUD + `render` + categories.
- **Database:** `Prompt` model.
- **API:** `/api/prompts` CRUD + `/api/prompts/render` + `/api/prompts/categories`.
- **Testing:** variable validation; render parity (server/client); run inserts
  resolved prompt; favorites/recent; curated read-only.
- **Branch/tag:** `phase-8.4` / `phase-8.4-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** none (independent).
- **Success:** a variable template renders, previews, and runs into the composer.

## M6 — Projects: schema + sidebar + routing

- **Goal:** `Project` + `ProjectMember`; chats gain `projectId`; project tree
  sidebar; `/p/[projectId]` routes; move chats.
- **Files:** `prisma/schema.prisma` (Chat.projectId), `/api/projects/*`,
  `ProjectSidebar.tsx`, `ProjectView` page, `ChatRepository` project filters,
  `useProjects`/`projects-store`.
- **Frontend:** tree sidebar (collapsible folders, Unfiled), project tabs.
  **Backend:** project CRUD + move-chat + scoped listings.
- **Database:** `Project`, `ProjectMember`; `Chat.projectId`;
  `KnowledgeFile.projectId`.
- **API:** `/api/projects` CRUD + `/api/projects/[id]/chats` + move chat.
- **Testing:** create/nest/archive/delete; chat move (messages preserved);
  Unfiled migration; scoped queries; permissions seed (personal only).
- **Branch/tag:** `phase-8.2` / `phase-8.2-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M1 (files scope), M4/M5 scoping hooks (additive).
- **Success:** a project contains chats + files + prompts + personas; moving a
  chat is lossless.

## M7 — Universal Search: unify entities

- **Goal:** grouped search across chats/messages/projects/prompts/knowledge/
  personas/bookmarks; filters; keyboard-first; ⌘K integration.
- **Files:** `src/services/SearchService.ts` (federation + ranking),
  `/api/search` (extend), `SearchDialog`, `SearchPage`, `useSearch`,
  bookmark index.
- **Frontend:** grouped results, entity filters, project filter, highlighting.
  **Backend:** fan-out per entity, merge/rank/page; snippet sanitization.
- **Database:** none required (live queries); optional `SearchIndex` later.
- **API:** extend `/api/search`; `/api/search/suggest`.
- **Testing:** each entity resolves; deep links + highlight; filters; keyboard
  nav; permission scoping (project membership); abort stale queries.
- **Branch/tag:** `phase-8.5` / `phase-8.5-complete`.
- **Rollback:** revert commit.
- **Dependencies:** M6, M4, M5 (indexed entities exist).
- **Success:** one query returns grouped hits across all entity types.

## M8 — Export: local formats + share links

- **Goal:** MD/TXT/HTML/copy export (client), signed share links.
- **Files:** `ExportMenu.tsx`, `ExportDialog.tsx`, `src/lib/export/serialize.ts`
  (md/txt/html), `src/app/api/share/*`, `ShareDialog.tsx`.
- **Frontend:** export menu in message/chat/project; share dialog. **Backend:**
  share-link create/resolve/revoke.
- **Database:** `ShareLink`.
- **API:** `POST /api/share`, `GET /api/share/[token]`, `DELETE /api/share/[token]`.
- **Testing:** all four formats; share link read-only + expiry + revoke; a11y.
- **Branch/tag:** `phase-8.6a` / `phase-8.6a-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M6 (project export scope).
- **Success:** a chat exports to MD/TXT/HTML and shares via a revocable link.

## M9 — Export: PDF/DOCX async jobs + integrations

- **Goal:** `ExportJob`; server PDF/DOCX generation; download; email-to-self
  (`mailto` MVP); notification hooks (toast now, 8.9 later).
- **Files:** `prisma/schema.prisma` (`ExportJob`), `/api/export/*`,
  `src/services/DocumentService.ts` (HTML→PDF/DOCX), job poller,
  `useExport`/`export-store`.
- **Frontend:** async progress in `ExportDialog`; download link. **Backend:**
  HTML rendering + conversion + R2 result + signed download.
- **Database:** `ExportJob`.
- **API:** `POST /api/export`, `GET /api/export/[id]`, `GET
  /api/export/[id]/download`.
- **Testing:** PDF/DOCX valid + correct content; theme option; job failure +
  retry; storage cleanup; notification emitted.
- **Branch/tag:** `phase-8.6b` / `phase-8.6b-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M8.
- **Success:** a chat exports to PDF/DOCX asynchronously with a download link.

## M10 — Draft & Autosave

- **Goal:** `Draft` + `DraftVersion`; debounced autosave; restore banner; draft
  tray; message edit history.
- **Files:** `prisma/schema.prisma` (`Draft`, `DraftVersion`), `/api/drafts/*`,
  `useDraft`, `DraftRestoreBanner`, `DraftTray`, `HistoryDialog`,
  composer integration.
- **Frontend:** autosave snapshot (content+tone+persona+context), restore UX.
  **Backend:** upsert/get/delete drafts + versions.
- **Database:** `Draft`, `DraftVersion`.
- **API:** `/api/drafts` GET/PUT/DELETE + `/api/drafts/[id]/versions`.
- **Testing:** refresh restore; conflict (newer wins + banner); scratch draft;
  version caps; edit-history restore.
- **Branch/tag:** `phase-8.8` / `phase-8.8-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** none (independent; pairs with M14).
- **Success:** refresh/crash never loses a draft; history restores versions.

## M11 — Notifications: inbox + events

- **Goal:** `Notification` + `NotificationPreference`; emit on generation done,
  credits low, knowledge indexed, export done; SSE unread; settings page.
- **Files:** `prisma/schema.prisma`, `src/services/NotificationService.ts`,
  `/api/notifications/*` (+ SSE), `NotificationBell`, `NotificationsPage`,
  `useNotifications`, event emits in message/export/knowledge paths.
- **Frontend:** bell + badge + dropdown + full page + settings. **Backend:**
  create/dedupe/list/read/stream.
- **Database:** `Notification`, `NotificationPreference`.
- **API:** full `/api/notifications` set + `/api/notifications/stream`.
- **Testing:** event → row → SSE → badge → mark read; dedupe window; credits_low
  threshold; deep links; preference gating.
- **Branch/tag:** `phase-8.9` / `phase-8.9-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M9 (export events), M2 (knowledge events), existing usage
  service (credits).
- **Success:** generation-complete and export-complete appear in the inbox with
  working deep links.

## M12 — Collaboration: share + permissions + comments

- **Goal:** real sharing: project members with roles; invite links; view/
  comment/edit; comment threads.
- **Files:** `prisma/schema.prisma` (activate `ProjectMember` roles, invite
  table), `/api/projects/[id]/invite`, `/api/projects/[id]/members`,
  `/api/comments/*`, `ShareDialog` (upgrade), `CommentThread.tsx`.
- **Frontend:** member list, role picker, invite UI, inline comments.
  **Backend:** role enforcement middleware; invite lifecycle; comment CRUD.
- **Database:** `Invite`, `Comment` (+ `projectId` scope on content queries).
- **API:** invite/members/comments + membership-aware reads.
- **Testing:** viewer cannot edit; editor can; invite accept/decline; comment
  on message; permission checks on every query (no IDOR).
- **Branch/tag:** `phase-8.7` / `phase-8.7-complete`.
- **Rollback:** revert; `migrate down`.
- **Dependencies:** M6 (projects), M10 (version history for edits).
- **Success:** a shared project enforces roles; comments persist and
  notify (8.9).

## M13 — Collaboration: version history in shared edits

- **Goal:** every edit creates a `MessageVersion`; history UI with who/when;
  restore.
- **Files:** extend `DraftVersion`/`MessageVersion`, `HistoryDialog` upgrade,
  edit pipeline (PATCH creates version).
- **Frontend:** "edited by X" badges; version picker. **Backend:** version
  capture on edit; retention window.
- **Database:** reuse `DraftVersion` with `messageId` (already designed).
- **API:** `GET /api/messages/[id]/versions`, `POST restore`.
- **Testing:** concurrent edits → distinct versions; retention cap; restore.
- **Branch/tag:** `phase-8.7b` / `phase-8.7b-complete`.
- **Rollback:** revert.
- **Dependencies:** M12.
- **Success:** shared-chat edit history shows each version + author.

## M14 — Offline: SW cache + outbox + recovery

- **Goal:** service-worker shell cache; IndexedDB outbox; offline drafting;
  reconnect sync; offline indicator.
- **Files:** `public/sw.js` (or workbox), `src/lib/offline/outbox.ts`,
  `src/stores/offline-store.ts`, `OfflineIndicator`, `SyncBar`,
  `/api/outbox/sync`, `useOffline`.
- **Frontend:** offline pill; queued-send state; sync bar. **Backend:** outbox
  sync endpoint (idempotent batch).
- **Database:** none (outbox is client-side); optional sync log.
- **API:** `POST /api/outbox/sync`, `GET /api/outbox/status`.
- **Testing:** offline draft persists; send queues + dedupes; reconnect flushes;
  no duplicate sends (idempotency keys); cached chat list readable offline.
- **Branch/tag:** `phase-8.8b` / `phase-8.8b-complete`.
- **Rollback:** revert commit.
- **Dependencies:** M10 (draft layer).
- **Success:** drop network → keep drafting + queue sends → reconnect syncs
  with no duplicates.

## M15 — Analytics: user + admin

- **Goal:** user analytics (words, generations, favorite tones, platforms,
  credits, time saved) + admin (revenue, subscriptions, usage, models, errors,
  latency).
- **Files:** `src/services/AnalyticsService.ts`, `src/app/api/analytics/*`,
  `/account/usage` (expand), `/admin` dashboard, chart components
  (lucide + lightweight SVG, no heavy chart lib).
- **Frontend:** usage dashboard + admin panels. **Backend:** aggregation over
  `UsageRecord`/`Usage`/`Subscription` (+ notification events).
- **Database:** none new; optional rollup tables when slow.
- **API:** `GET /api/analytics/me`, `GET /api/analytics/admin/*`.
- **Testing:** metric correctness vs raw records; period rollups; role-gated
  admin routes; latency/error tallies.
- **Branch/tag:** `phase-8.10` / `phase-8.10-complete`.
- **Rollback:** revert.
- **Dependencies:** M11 (event sources), existing usage service.
- **Success:** dashboards reflect real usage numbers.

## M16 — Email notifications (enhancement)

- **Goal:** email delivery for critical types (credits_low, invites,
  subscription) via provider.
- **Files:** `src/services/EmailService.ts`, delivery worker, preference
  channel flag.
- **Testing:** send on event; preference gates; deliverability (SPF/DKIM);
  unsubscribe link.
- **Branch/tag:** `phase-8.9b` / `phase-8.9b-complete`.
- **Dependencies:** M11.
- **Success:** invites + credits-low land in inbox.

## M17 — Performance pass (horizontal)

- **Goal:** bundle size, lazy loading, caching, image optimization, animation
  perf, a11y, SEO, error monitoring, structured logging.
- **Files:** `next.config`, route-level suspense (already partially present),
  `src/lib/logger.ts` hooks, Sentry-style error boundary, image priority
  tuning, audit fixes.
- **Testing:** Lighthouse (perf/a11y/SEO) before/after; bundle analyzer diff;
  reduced-motion paths verified.
- **Branch/tag:** `phase-8.11` / `phase-8.11-complete`.
- **Dependencies:** all prior (measure whole app).
- **Success:** measurable Lighthouse gains + clean bundle report.

## M18 — Release hardening

- **Goal:** full regression, migration dry-run on prod, env checklist,
  versioned release notes, feature flags for every new surface.
- **Files:** docs/release notes, feature flags in `FeatureFlagService`,
  `.env.example` updates.
- **Testing:** full manual test pass of M1–M17; rollback rehearsal.
- **Branch/tag:** `phase-8-release` / `release-1.0-rc`.
- **Dependencies:** M17.
- **Success:** clean release candidate with documented rollback.

---

## Milestone dependency graph

```
M1 ──► M2 ──► M3              (Knowledge)
                        ┌──► M6 ──► M7   (Projects → Search)
M4 (Personas) ──────────┤
M5 (Prompts) ───────────┘
M8 ──► M9                    (Export)
M10 ──► M14                  (Draft/Autosave → Offline)
M12 ──► M13                  (Collaboration)
M11 ◄── M9, M2, M12          (Notifications on events)
M15 ◄── M11, M6, M9          (Analytics on everything)
M16 ◄── M11
M17 ◄── all
M18 ◄── M17
```

## Sequencing recommendation (shortest critical path)

1. **M1 → M2 → M3** (Knowledge — highest value, unblocks RAG).
2. **M4, M5** in parallel (independent quick wins).
3. **M6 → M7** (Projects spine → Universal Search).
4. **M8 → M9** (Export).
5. **M10 → M14** (Autosave → Offline).
6. **M11** then **M12 → M13** (Notifications, then Collaboration — needs
   events).
7. **M15 → M16 → M17 → M18**.

Two engineers could safely run M4/M5 and M8/M9 in parallel with M1–M3.
