# Page Hierarchy

> Every page and every destination: current state, target state, purpose, and
> deep-link rules. Every navigation item resolves to one of these destinations.

## 1. Current routes → target routes

| Current route | Target | Purpose |
|---|---|---|
| `/` | `/` | Marketing site (unchanged) |
| `/sign-in`, `/sign-up` | same | Clerk auth |
| `/login`, `/register` | redirect → `/sign-in`, `/sign-up` | legacy |
| `/onboarding` | `/onboarding` | first-run (3 steps) |
| `/about`, `/blog`, `/blog/:id`, `/privacy`, `/terms` | same | public content |
| `/chat` (empty-state index) | `/compose` | WORK home — Compose section root |
| `/chat/[chatId]` | `/compose/:id` | a conversation |
| `/tools` | `/tools` | CAPABILITY — tool catalog |
| `—` (dead `PromptLibrary.tsx`) | `/library/prompts` | ASSETS — templates + saved prompts |
| `—` (personas in Settings) | `/library/tones` | ASSETS — built-in tones + custom personas |
| `—` (upload API exists) | `/library/knowledge` | ASSETS — reference documents |
| `/search` + ⌘⇧F overlay | `/search` (single, scoped) | FIND — global retrieval |
| `/billing` | `/account/billing` | META — plan, upgrade, manage |
| `—` (usage inside billing page) | `/account/usage` | META — meters & limits |
| `/settings` | `/account/{profile,appearance,notifications,danger}` | META — configuration |

## 2. Target sitemap (decision of record)

```
/                            Marketing (public)
└─ /onboarding               First-run: type → language → default tone

/(shell)                     authenticated
  /compose                   WORK — Compose home          [was /chat]
  ├─ /compose/:id            a conversation
  ├─ /compose/new            [optional] blank conversation
  └─ /compose/archived       [optional] archived filter (else a sidebar toggle)

  /tools                     CAPABILITY — tool catalog
  /tools/:toolId             [optional] deep-link to a specific tool panel

  /library                   ASSETS
  ├─ /library/prompts
  │  └─ /library/prompts/:id
  ├─ /library/tones
  │  └─ /library/tones/:id
  └─ /library/knowledge
     └─ /library/knowledge/:id

  /search                    FIND — scoped retrieval

  /account                   META
  ├─ /account/profile
  ├─ /account/appearance
  ├─ /account/notifications
  ├─ /account/billing
  ├─ /account/usage
  └─ /account/danger
```

## 3. Page-by-page purpose (each page exists for exactly one job)

| Page | Job | Explicitly NOT |
|---|---|---|
| `/compose` | land and start/continue work | a dashboard, an empty shell |
| `/compose/:id` | read and extend one conversation | |
| `/tools` | browse and invoke a single-purpose action | a library of prompts |
| `/library/prompts` | reuse a prompt template | a place to *run* prompts (Compose does) |
| `/library/tones` | view/create/edit a voice (built-in or custom) | a settings chore |
| `/library/knowledge` | own reference material | a chat attachment list (Compose attaches) |
| `/search` | retrieve anything | navigation (⌘K's job) |
| `/account/profile` | who you are | content creation |
| `/account/appearance` | theme + preferences | |
| `/account/notifications` | how you're reached | |
| `/account/billing` | what you pay | your consumption (see usage) |
| `/account/usage` | what you've consumed | a sales page |
| `/account/danger` | delete account | |

## 4. Deep-link rules

1. Every asset has a stable, shareable URL: `/compose/:id`, `/library/prompts/:id`,
   `/library/tones/:id`, `/library/knowledge/:id`, `/tools/:toolId`.
2. Search results deep-link into the exact asset — a conversation scrolls to the
   matching message; a prompt/tone/knowledge opens its detail inline.
3. Share produces `…/compose/:id` (public share links are out of scope for Phase 7).
4. Back/forward must work everywhere because destinations are URLs, not modal state.

## 5. Orphaned & dead routes to clean up

- `PromptLibrary.tsx` — dead component; wire it into `/library/prompts`.
- `/login`, `/register` — replace with redirects.
- `/api/tools` route — kept (tool metadata), only its UI is orphaned today.
- The ⌘⇧F overlay (`UniversalSearch.tsx`) — removed; `/search` absorbs it.
- The four-icon quick-action row in `ConversationSidebar.tsx` — removed; the
  rail replaces it.

## 6. Hierarchy (visual order of destinations)

1. **Public**: Marketing → Pricing/FAQ/CTA → Sign up.
2. **First-run**: Sign up → Onboarding → Compose.
3. **Authenticated priority** (frequency): Compose > Tools > Library > Search > Account.
4. **Account priority** (importance): Profile > Billing > Usage > Appearance >
   Notifications > Danger.
