# Navigation Map

> The single navigation philosophy, the rail, section-level navigation, mobile
> chrome, and keyboard accelerators. Companion to `App-Architecture.md`.

## 1. Philosophy

**The rail is a map, not a menu.** Five destinations, each meaningfully
distinct, ordered by frequency of use, always visible with labels. Power users
get ⌘K; beginners get obvious labeled items. Navigation takes you to *fuel* or
to *finished work*, never to a second writing surface.

Three rules that decide every nav question:

1. **Content type, not activity type** — you navigate to a conversation, a
   prompt, a tone, a knowledge file; never to a "rewrite" or a "write email".
2. **One canonical home per asset** — no asset is reachable from two competing
   places.
3. **The workspace mode switcher is not navigation** — it changes layout
   density, never *where things live*.

## 2. Primary rail (desktop, persistent)

```
┌────────────────────────────┐
│ ◆  [workspace switcher]    │   ← future teams/orgs (Feature-Roadmap §7)
│────────────────────────────│
│ ✍  Compose     (⌘1)  [home]│   WORK — conversations, the composer
│ 🛠  Tools       (⌘2)        │   CAPABILITY — single-purpose actions
│ 📚  Library     (⌘3)        │   ASSETS — prompts · tones · knowledge
│ 🔍  Search      (⌘4)        │   FIND — one global retrieval
│────────────────────────────│
│ ⚙  Account                 │   META — profile · billing · usage
│────────────────────────────│
│ ✚  New Chat    (⌘N)        │   global action, jumps to Compose
│ ⌘  ⌘K Palette  (⌘K)        │   navigation/action accelerator
└────────────────────────────┘
```

- **Compose** is default landing after onboarding (and after login). It is home.
- Five items stays at the working-memory sweet spot and maps 1:1 to a mobile
  tab bar (§6). Adding a sixth is allowed only for a *new bucket*, never for a
  feature.
- The rail is always visible in every layout mode. Focus/writer modes hide the
  *conversation sidebar and context panel*, never the rail.
- Items are icon + text label (≥12px). The current 10px unlabeled icon row in
  the conversation sidebar is removed — it was the entire navigation.

## 3. Section-level navigation

| Section | Sub-navigation |
|---|---|
| **Compose** | Left conversation sidebar: Pinned · Favorites · Today/Yesterday/This Week/Older. A "Manage" toggle expands to a full index with filters (archived, tone) and bulk actions. |
| **Tools** | Category pill row → grid of tool cards. A tool opens **inline in the center pane**; no page change. |
| **Library** | Sub-nav tabs: **Prompts / Tones / Knowledge**. Each tab = list + inline detail. |
| **Search** | Scope tabs: **All / Conversations / Messages / Prompts / Tones / Knowledge**. |
| **Account** | Sub-nav: **Profile · Appearance · Notifications · Billing · Usage · Danger Zone**. |

Section sub-navigation never replaces the rail. A section's internal nav is
local; the rail stays put.

## 4. Search: four systems → one, with two clear roles

The audit found four overlapping search surfaces. Decision — **three clear
purposes, one destination:**

| Surface | Role after Phase 7 | Lives where |
|---|---|---|
| **Universal Search overlay** (⌘⇧F) | **Removed.** Its retrieval function is absorbed by the Search section. | deleted |
| **Search page** (`/search`) | **Retrieval** — find a *thing* (conversation, message, prompt, tone, knowledge) across scopes. The one search destination. | `/search` |
| **Command Palette** (⌘K) | **Navigation & actions** — jump to a *place* or run an *action* (New Chat, switch mode, go to a tool). It is never a full-text engine. | overlay |
| **Conversation sidebar filter** | **Filter, not search** — narrows *conversation titles* in place. It doesn't search message content and doesn't leave Compose. | inside sidebar |

Deduping rules:
- ⌘K and Search do not compete: one is navigation, one is retrieval. ⌘K keeps a
  single "Search…" entry that opens the Search section.
- The sidebar filter only matches titles of the already-loaded conversation
  list; message-content search is exclusively the Search section's job.
- The ⌘⇧F shortcut is dropped (or rebound to jump straight to `/search`); the
  overlay component `UniversalSearch.tsx` is removed.

## 5. Quick actions & shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` | Command palette (navigation/actions) |
| `⌘N` | New Chat → jump to Compose |
| `⌘1–⌘4` | Rail: Compose / Tools / Library / Search |
| `⌘B` | Toggle conversation sidebar |
| `⌘\` | Toggle context panel |
| `⌘⇧S` | Open Search section |
| `Escape` | Close any overlay / tool panel / drawer |

New Chat is global — it creates a conversation and jumps to Compose, from any
section. It is never buried inside Compose's sidebar.

## 6. Mobile navigation (same map, different chrome)

- **Bottom tab bar** with the same five buckets, in the same order. Icons +
  labels; the active tab tinted.
- **Library** sub-nav → top segmented control (Prompts / Tones / Knowledge).
- **Compose** conversation sidebar → slide-over drawer (hamburger / ⌘B in
  header); **context panel** → bottom sheet.
- **Account** sub-nav → nested list page (Account → tap section → list).
- Tool panels open as a full-screen sheet on mobile, inline on desktop.
- New Chat is a prominent bar above the tab bar, not a tiny icon.

## 7. Breadcrumbs & back behavior

- No browser-history gymnastics: every section has a stable URL
  (`/compose/:id`, `/library/prompts`, `/account/billing`), so back/forward
  just works and every screen is deep-linkable.
- Tool panels and Library details open inline and close with `Escape` or a close
  affordance — they do not navigate, so there is no "back to grid" dead end.
