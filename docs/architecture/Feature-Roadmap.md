# Feature Roadmap

> Feature organization and build order for Phase 7. Every feature has one
> logical home (see `App-Architecture.md` §4) and a decided scope.

## 1. Feature ownership map (where each feature lives)

| Feature | Home | Status today |
|---|---|---|
| Conversation CRUD (new/rename/duplicate/share/pin/favorite/archive) | Compose | exists (`use-chat`) |
| Streaming chat | Compose | exists |
| Tone bar + tones | Compose composer / Library → Tones | partial (tones exist, no management surface) |
| Custom personas | **Library → Tones** (moved from Settings) | exists behind Settings |
| AI writing tools (40+) | Tools | exists (`/tools`, orphaned entry) |
| Prompt library | **Library → Prompts** | data exists (`PromptLibrary.tsx` dead) |
| Knowledge / uploads | **Library → Knowledge** (new surface) | backend exists (`/api/upload`, storage counters); no UI |
| Global search | Search (scoped) | partial (`/api/search` service, two overlapping UIs) |
| Command palette | overlay | exists |
| Appearance / preferences | Account → Appearance | partial (`/api/preferences`) |
| Notifications | Account → Notifications | exists but toggles are local-only |
| Billing / plan | Account → Billing | exists (`/billing`, Paddle) |
| Usage meters | Account → Usage (split from Billing) | exists, buried in billing page |
| Delete account | Account → Danger | exists |
| Feedback (like/dislike) | Compose thread | partial (UI toasts, persistence pending) |
| Continue / regenerate | Compose thread | exists |

## 2. What gets cut or deferred

| Item | Decision | Why |
|---|---|---|
| ⌘⇧F search overlay | **Cut** | absorbed by Search section |
| 5 workspace modes | **Reduced to 3** (Standard / Focus / Writer) | overlap; density ≠ content |
| 4 quick-action icons in sidebar | **Cut** | replaced by rail |
| `/login`, `/register` pages | **Redirect** | legacy |
| Analytics / dashboard | **Deferred (not built)** | no need; Usage covers it |
| "Saved" destination | **Deferred (filter only)** | Library → Prompts → My saves |
| Standalone archive page | **Deferred (filter only)** | Compose sidebar filter |
| Template marketplace | **Deferred** | Library gains "Community" source later |
| Teams / workspaces | **Deferred** | Clerk org support + rail switcher later |
| Public share links | **Deferred** | share copies the private URL today |
| "(/)" command system | **Deferred** | removed from UI until a real system exists |
| Notifications (real delivery) | **Deferred** | toggles stay but are honest ("soon") until a delivery backend |

## 3. Build order (each step independently shippable, additive, no broken routes)

Order chosen so each step is visible and revertible:

1. **Persistent rail + relabel Compose** — add `AppShell` with the 5-item rail
   across the `(dashboard)` group; rename `/chat` → `/compose` (keep old routes
   as redirects). This is the spine everything else hangs on.
2. **Move personas → Library → Tones** — relabel the Settings persona UI into a
   Tones tab; Settings drops personas. (One surface per asset.)
3. **Wire Prompt Library → Prompts tab** — mount the dead `PromptLibrary` data;
   add "Use in Compose". (Unlocks an asset users can't see today.)
4. **Knowledge tab** — build the list over existing upload API + storage
   counters; add attach-from-context-drawer.
5. **Unify Search** — delete the overlay, keep one scoped Search section; drop
   ⌘⇧F (or rebind to `/search`).
6. **Split Account / Billing / Usage** — extract meters into Usage; Billing
   keeps plan + Paddle.
7. **Reduce workspace modes to 3** — delete `split`/`compact`/`minimal` handling;
   keep Standard/Focus/Writer.
8. **Component polish** — apply `docs/design/*` tokens/recipes to the new
   surfaces (Phase 7.5).

## 4. Acceptance criteria per feature (the Phase 7.4 success bar)

- **Every page has a defined purpose** — each route in `Page-Hierarchy.md` §2
  maps 1:1 to a job, and no job has two routes.
- **Every navigation item has a defined destination** — the rail's 5 items each
  resolve to one section; the section sub-navs each resolve to a page in the
  sitemap. No dead links (the dead `PromptLibrary` is gone by step 3).
- **Every feature belongs to one logical area** — verified by the ownership map
  above: personas → Tones, prompts → Prompts, knowledge → Knowledge, usage →
  Usage, billing → Billing.
- **Duplicate search resolved** — one retrieval surface (`/search`), one
  navigation surface (⌘K), one filter (sidebar title filter). Overlay removed.
- **Workspace layout finalized** — two panes + context drawer (§1
  `Workspace-Architecture.md`); modes = 3.
- **Onboarding finalized** — optional, 3 steps, lands on Compose with the rail
  visible.
- **Mobile navigation defined** — bottom tab bar + drawer/sheet pattern
  (`Navigation-Map.md` §6).

## 5. Definition of done for Phase 7.4 (this phase)

- [x] `docs/architecture/` created
- [x] `App-Architecture.md` — surfaces, shell, five buckets, API map
- [x] `Navigation-Map.md` — philosophy, rail, section nav, search resolution, mobile
- [x] `Page-Hierarchy.md` — route map, per-page purpose, deep-link rules
- [x] `Workspace-Architecture.md` — compose pane, modes, section panes
- [x] `Component-Hierarchy.md` — component tree per section
- [x] `User-Flows.md` — new/returning/power/mobile/billing flows
- [x] `Feature-Roadmap.md` — ownership, cuts, build order, criteria

No React components were modified in this phase.
