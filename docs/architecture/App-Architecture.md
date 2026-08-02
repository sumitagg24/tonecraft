# App Architecture

> ToneCraft's complete application structure: surfaces, shell, routes, API
> layer, and the decisions that shape them. This is the blueprint for Phase 7
> implementation. Companion docs: `Navigation-Map.md`, `Page-Hierarchy.md`,
> `Workspace-Architecture.md`, `Component-Hierarchy.md`, `User-Flows.md`,
> `Feature-Roadmap.md`.

## 1. The product in one sentence

ToneCraft transforms a piece of writing into a chosen voice. **Compose** is the
only place work happens; everything else is fuel for the composer or a record
of work done there.

## 2. Surface map (public)

```
/                          Landing — marketing site (public)
├─ /sign-in                Clerk sign-in
├─ /sign-up                Clerk sign-up
├─ /onboarding             First-run (auth required)
├─ /about                  Company/mission
├─ /blog, /blog/:id        Content marketing
├─ /privacy, /terms        Legal
└─ /login, /register       Legacy redirects → /sign-in, /sign-up
```

Landing sections (current): Hero · InteractiveDemo/Playground · RoleSelector ·
BentoGrid · FeatureShowcase · Capabilities · WhyToneCraftComparison ·
AIWorkflowSection · CommunicationJourney · WorkspaceShowcase · Pricing ·
Testimonials · FAQ · CTA · Footer.

## 3. Authenticated shell

Current: the `(dashboard)` route group wraps every authed page in
`WorkspaceLayout` — a single three-pane layout (conversation sidebar · content ·
context panel) with a per-route topbar, a ⌘⇧F search overlay, `CommandPalette`,
and `PremiumCursor`.

Structural defect: **there is no global navigation.** The chat workspace *is*
the shell. `/tools`, `/search`, `/settings`, `/billing` replace the whole
screen and are only reachable through a row of four unlabeled 10px icons
(History · Tools · Search · Settings) at the bottom of the conversation
sidebar. Leaving Compose discards context; nothing labels the map of the app.

### 3.1 Proposed shell

```
┌──────────┬────────────────────────────────────────────┐
│ GLOBAL   │  SECTION (rendered per route)              │
│ RAIL     │  ┌──────────────────────────────────────┐  │
│ (5 items)│  │  section header (breadcrumb, actions) │  │
│          │  ├──────────────────────────────────────┤  │
│ Compose  │  │  section content                      │  │
│ Tools    │  │                                       │  │
│ Library  │  │                                       │  │
│ Search   │  │                                       │  │
│ Account  │  └──────────────────────────────────────┘  │
│          │                                            │
│ ⌘K  ⌘N  │                                            │
└──────────┴────────────────────────────────────────────┘
```

- One persistent, always-labeled rail (icon + text) that survives every route.
- Sections are the five content buckets (see §4). Each section owns its internal
  sub-navigation; the rail never changes *within* a section.
- The rail is the map; sections are the rooms. Leaving a section never destroys
  the way back.

## 4. The five buckets

Everything the user touches belongs to exactly one bucket. Navigation orders
them by frequency of use (Work > Capability > Assets > Find > Meta).

| Bucket | Destination | Contents | User's question |
|--------|-------------|----------|-----------------|
| WORK | Compose | conversations, thread, composer, tone bar, context | "write" |
| CAPABILITY | Tools | 40+ single-purpose writing actions | "do a thing" |
| ASSETS | Library | prompts · tones (incl. custom personas) · knowledge | "reuse what I own" |
| FIND | Search | one global retrieval surface | "where was that?" |
| META | Account | profile · appearance · notifications · billing · usage · danger | "manage me" |

Rules:
- **One canonical home per asset.** A persona lives in Library → Tones, never
  also in Settings. A prompt lives in Library → Prompts, never only as a dead
  component. This is the single biggest structural fix of Phase 7.
- **Content type, not activity type.** Navigate to *things*, never to
  *activities*. "Rewrite", "Reply", "Tone up" are actions taken on text from
  within a thing, not destinations.
- **Billing ≠ telemetry.** Pricing/plan (a purchase decision) is separated from
  usage meters (telemetry) so a paying user is never told to "upgrade" while
  staring at their own over-limit meters.

## 5. API layer (unchanged by Phase 7 — consumed, not moved)

The API is already well-partitioned and supports the proposed IA:

```
/api/chats · /api/chats/:id · /api/chats/:id/messages   → Compose data
/api/messages/:id/continue · /regenerate · /feedback    → thread actions
/api/personas · /api/personas/:id                       → Library → Tones
/api/upload                                              → Library → Knowledge
/api/search                                              → Search (SearchService)
/api/preferences                                         → Account → Appearance
/api/usage · /api/usage/stats                            → Account → Usage
/api/billing/checkout · /portal · /webhook               → Account → Billing (Paddle)
/api/user · /api/user/profile · /api/user/onboarding     → Account → Profile
/api/user/delete                                         → Account → Danger
/api/tools                                               → Tools capability metadata
/api/health · /api/webhook/clerk                         → ops
```

Phase 7 only *relabels* where these are reached from; it does not re-architect
them. The upload API + storage counters already exist — the Knowledge **surface**
is the missing piece, not the backend.

## 6. Authentication & first-run

- Clerk handles sign-in/sign-up (hosted pages at `/sign-in`, `/sign-up`).
- After sign-up: `/onboarding` (3 steps: writing type → language → default
  tone) → lands on **Compose**. Onboarding is optional today; the decision to
  enforce or soften it is in `User-Flows.md` §3.
- Public pages never render the shell; authed pages always do.

## 7. What does NOT exist (and should not be invented)

| Speculative surface | Decision | Reason |
|---|---|---|
| Analytics / dashboard | **Not built** | No product need; Usage meters already cover consumption. Revisit only if a user asks for it. |
| "Saved" destination | **Not built** | It's a filter (Library → Prompts → My saves), not a place. |
| Standalone archive page | **Not built** | Archive is a state of a conversation, managed via a filter inside Compose. |
| Home/dashboard page | **Not built** | Compose *is* home. A separate dashboard would be a second writing surface. |
| Knowledge attach wizard | **Not built** | Attaching a doc is one action inside Compose's context drawer. |
| Template marketplace | Deferred | Library tabs gain a "Community" source later; it's a permission layer, not a new surface (`Feature-Roadmap.md` §7). |
| Teams / workspaces | Deferred | Rail gains a workspace switcher placeholder when Clerk org support ships. |

## 8. Mobile (same architecture, different chrome)

- The 5-bucket rail collapses 1:1 into a **bottom tab bar**.
- Library's sub-nav (Prompts / Tones / Knowledge) becomes a top segmented control.
- Compose's conversation sidebar becomes a slide-over drawer; the context panel
  becomes a bottom sheet.
- Account sub-nav becomes a nested list page.
- Full treatment in `Navigation-Map.md` §6 and `User-Flows.md` §7.

## 9. Migration principle

Every step is **additive and independently shippable**; no step breaks a live
route. Order and per-step detail in `Feature-Roadmap.md` §10.
