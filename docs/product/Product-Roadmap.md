# ToneCraft — Product Roadmap (Phase 8.0)

> **Status:** Design only — no implementation.
> **Scope:** Everything after the Phase 7 UI/UX rewrite. ToneCraft is being
> designed as a premium AI communication platform, comparable in quality and
> craft to ChatGPT, Claude, Notion AI, Grammarly, Linear, and Cursor.
>
> This document defines the pillars, phases, dependencies, and build order for
> all product work. Each feature has a dedicated spec in `docs/product/`.

---

## 1. Product vision

ToneCraft is an AI communication studio: write once, speak perfectly
everywhere. Users craft text, tune its tone/persona/platform fit, attach their
own knowledge, and ship the result to any destination — with the quality
bar of a premium developer tool.

Three qualities define "premium" for us:

1. **Correctness first.** No fake controls, no dead ends, every surface honest
   about what it does.
2. **Flow over feature count.** The workspace gets out of the way; the AI
   anticipates the next step (autosave, smart retry, contextual tools).
3. **Craft.** Motion, loading states, empty states, and error states are
   designed, not incidental.

---

## 2. Major product pillars

| Pillar | One-line purpose | Primary surface |
|---|---|---|
| **P1 Compose** | The core chat/rewrite studio with tones, personas, tools, streaming | Workspace (built) |
| **P2 Knowledge** | Upload documents the AI can ground its answers in | Knowledge Library + attach in compose |
| **P3 Projects** | Organize chats, files, prompts, and personas into logical folders | Projects sidebar/tree |
| **P4 Personas 2.0** | Reusable voice definitions: prompt, tone, temp, style, platform defaults | Persona picker + CRUD |
| **P5 Prompt Library** | Categorized, templated, variable-driven prompts | Library → Prompts |
| **P6 Search** | One search across chats, projects, messages, prompts, knowledge, personas, files, bookmarks | Search page + ⌘K |
| **P7 Export** | Ship content to PDF/DOCX/MD/HTML/TXT, copy, share, email, Notion, Slack | Export menu + share |
| **P8 Collaboration** | Share chats with invite, view/comment/edit, permissions, version history | Share dialog + activity |
| **P9 Draft & Autosave** | Never lose work: autosave, recovery, offline draft, session restore, history | Composer + draft tray |
| **P10 Notifications** | Generation done, credits low, invites, knowledge indexed, export complete | Notification center |
| **P11 Analytics** | User + admin usage/revenue analytics | Account → Usage + admin |
| **P12 Performance** | Bundle, lazy loading, caching, images, animation, a11y, SEO, monitoring | Cross-cutting |

---

## 3. Features grouped into logical phases

Dependencies flow downward; a phase may start only when everything it lists
as *depends on* is shipped.

| Phase | Theme | Features | Depends on |
|---|---|---|---|
| **8.1** | **Knowledge Base** | Upload+index+retrieval+context injection | P1 (compose), P2 infra |
| **8.2** | **Projects** | Folders, project chats/files/prompts/personas, sharing, permissions | 8.1 (files), P5 |
| **8.3** | **Personas 2.0** | Picker, CRUD, import/export, favorites, default, platform defaults | P1 |
| **8.4** | **Prompt Library** | Categories, templates, variables, preview, favorites, recent | P5 |
| **8.5** | **Universal Search** | All-entity search, filters, keyboard-first | 8.2, 8.3, 8.4 (indexes entities) |
| **8.6** | **Export System** | PDF/DOCX/MD/HTML/TXT, copy, share, email, Notion, Slack | 8.1, 8.2 (context) |
| **8.7** | **Collaboration** | Share, invite, view/comment/edit, permissions, version history | 8.2 (projects), P9 |
| **8.8** | **Draft & Autosave** | Autosave, recovery, offline draft, session restore, history | P1, 8.7 (version history) |
| **8.9** | **Notifications** | Generation done, credits low, invites, indexed, export done | 8.1, 8.6, 8.7 (events) |
| **8.10** | **Analytics & Admin** | User analytics + admin dashboards | 8.6, 8.9 (events), 6.x (usage) |
| **8.11** | **Performance** | Bundle, lazy loading, caching, images, animation, a11y, SEO, monitoring | All prior |

---

## 4. Dependency graph

```
P1 Compose ─────────────────────────────────────────────┐
  ├── 8.1 Knowledge ──▶ 8.2 Projects ──▶ 8.5 Search      │
  ├── 8.3 Personas ────────────────────▶ 8.5 Search      │
  ├── 8.4 Prompt Library ──────────────▶ 8.5 Search      │
  │                                                     ▼
  ├── 8.6 Export ◀─────────────────────────── 8.7 Collaboration
  ├── 8.8 Draft/Autosave ◀── (version history) 8.7
  ├── 8.9 Notifications ◀── 8.1 / 8.6 / 8.7 events
  └── 8.10 Analytics ◀── all event sources
  └── 8.11 Performance (horizontal, runs alongside)
```

Explicit rules:

- **8.5 Search cannot ship before 8.2/8.3/8.4** — it indexes those entities.
- **8.7 Collaboration needs 8.2** (sharing is project-scoped first, chat-scoped second).
- **8.8 Autosave is a hard dependency for collaboration version history**; build autosave first, surface history in 8.7.
- **8.9 Notifications needs 8.6/8.7** to have meaningful event sources, but a minimal in-app toast layer can ship with 8.1 (knowledge indexed).
- **8.11 Performance is continuous**; a focused pass lands last.

---

## 5. Build order & independent shipping

Order is chosen so each milestone is independently shippable, additive, and
never breaks a route:

1. **8.1 Knowledge Base** — first real feature; highest user value.
2. **8.3 Personas 2.0** — independent, no knowledge dependency, quick win.
3. **8.4 Prompt Library** — independent, resurrects dead data.
4. **8.2 Projects** — depends on knowledge files; becomes the organizing spine.
5. **8.5 Universal Search** — after 8.2/8.3/8.4 so everything is searchable.
6. **8.6 Export System** — after knowledge + projects for full-context export.
7. **8.8 Draft & Autosave** — safe to ship anywhere; pairs with 8.7.
8. **8.7 Collaboration** — needs 8.2; largest scope, last big feature.
9. **8.9 Notifications** — after event sources exist.
10. **8.10 Analytics** — consumes everything; near the end.
11. **8.11 Performance** — final polish pass.

**Can ship independently (no upstream blocker):** 8.3, 8.4, 8.8, 8.11.
**Sequenced:** 8.1 → 8.2 → 8.5; 8.6 → 8.9; 8.7 → 8.9 → 8.10.

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Embedding infra cost/complexity | High | Start with hosted embeddings API (OpenAI) + pgvector; revisit self-host only if costs prove it |
| Document parsing variance (PDFs, scanned) | Medium | Extract-text-first pipeline; explicit "no text extracted" error state; OCR as later add-on |
| RAG context quality / hallucination | High | Cite sources in answers, source-aware UI, similarity threshold cutoffs, eval set |
| Storage & cost abuse on free tier | Medium | Strict per-plan storage + file counts; quota checks at upload |
| Permission model complexity (share/edit) | High | Start read-only share → comments → edit; explicit roles, never implicit |
| Version history storage growth | Medium | Snapshot diffs, retention window, cap per project |
| Notification delivery reliability (email/push) | Medium | In-app center first (DB rows), email/Push later; honest "soon" states |
| Collaboration + autosave merge conflicts | High | Append-only messages; edits create versions, not rewrites |
| Scope creep (premium bar) | Medium | MVP vs Premium split (below); roadmap is the contract |

---

## 7. MVP vs Premium

| Feature | MVP (all plans) | Premium (paid) |
|---|---|---|
| Knowledge | Basic: up to N docs, standard formats | Larger quotas, longer retention, OCR, priority indexing |
| Projects | Personal projects only | Shared projects, nested folders, team workspace |
| Personas | 3 slots + custom | Unlimited, import/export, team personas |
| Prompt Library | Core categories + variables | Full template marketplace, team sharing |
| Search | All personal entities | Cross-workspace, saved searches |
| Export | MD/HTML/TXT/copy | PDF/DOCX/email/Notion/Slack, batch |
| Collaboration | View-only share | Comments + edit + version history |
| Draft/Autosave | Autosave + recovery | History retention + offline sync |
| Notifications | In-app only | Email + push + digest |
| Analytics | Personal usage | Team + admin dashboards |
| Model access | Auto/standard models | Premium models, priority queue |

---

## 8. Estimated implementation complexity

| Feature | Relative complexity (1–5) | Main cost driver |
|---|---|---|
| 8.1 Knowledge | 4 | Embedding pipeline, parsing, RAG |
| 8.2 Projects | 3 | Data model + permissions |
| 8.3 Personas | 2 | Simple CRUD + context wiring |
| 8.4 Prompt Library | 2 | Templating + variables |
| 8.5 Search | 2 | Multi-entity index + ranking |
| 8.6 Export | 3 | Document generation, integrations |
| 8.7 Collaboration | 5 | Permissions, realtime, versioning |
| 8.8 Draft/Autosave | 2 | Debounce + recovery UX |
| 8.9 Notifications | 3 | Event bus + channels |
| 8.10 Analytics | 3 | Aggregation + dashboards |
| 8.11 Performance | 2 | Measurement + tuning |

Complexity is per-feature isolated; integration is counted in the
Implementation Plan's milestones.

---

## 9. Success bar for Phase 8 (design complete)

- [ ] Every pillar above has a spec in `docs/product/`
- [ ] Every feature has: purpose, user flow, data model, API list, frontend
      architecture, security, limits, future roadmap
- [ ] Build order is dependency-safe and each step is independently shippable
- [ ] The Implementation Plan breaks Phase 8 into small, verifiable milestones
      with rollback and success criteria

No application code is modified by Phase 8.
