# ToneCraft AI — Information Architecture

Role: Senior UX Architect (Linear · Notion · Discord · OpenAI lens).
Scope: structure, navigation, hierarchy, workspace organization, scalability — **no colors, no typography**.

---

## 0. Current-state audit

What actually exists today, and the structural problems found in the code:

| Asset | Current home | Problem |
|---|---|---|
| Conversations (chats) | Left sidebar in the chat workspace only | Sidebar is the *only* nav; gone when you leave chat |
| Tone controls | Inline bar on the composer + right "AI Context" panel | Fine as a control, but no place to *manage* tones |
| Custom personas | **Settings → Profile tab → Add Persona** | Content creation buried under account config — 3+ clicks to reach |
| Prompt library / templates | `PromptLibrary.tsx` component — **never imported anywhere** | Dead code; users cannot see prompts at all |
| AI Writing Tools | `/tools` page | Orphaned: only reachable via a tiny icon at the sidebar bottom |
| Search | `/search` page **and** a ⌘⇧F overlay | Two overlapping search surfaces |
| Billing | `/billing` page | Mixes *marketing* (pricing cards) with *account telemetry* (usage meters) |
| Knowledge Base | — | Feature doesn't exist (upload API + storage counters already do) |

Core structural defect: **there is no global navigation.** The chat workspace *is* the app shell. Every non-chat destination (`/tools`, `/search`, `/settings`, `/billing`) is a full-page replacement that discards context, reachable only through a row of unlabeled 10px icons at the bottom of the conversation sidebar.

---

## 1. Design principles

1. **Content type, not activity type.** Navigate users to *things* (a conversation, a prompt, a tone, a knowledge file), never to *activities* (a "rewrite", a "write email"). Activities are actions taken *on* things, from within a thing.
2. **One canonical home per asset.** Every content type lives in exactly one place. No asset is reachable from two competing locations (personas in Settings **and** a tone picker is exactly the bug this fixes).
3. **Compose is the surface; everything else is fuel.** The composer is the only place work happens. Tools, prompts, tones, and knowledge exist to be *launched into* the composer. Navigation gets you to fuel or to finished work, never to a second writing surface.
4. **A persistent shell.** The primary nav rail is always visible and labeled. Navigation never destroys context and never hides the way back home.
5. **The rail is a map, not a menu.** Five destinations, each meaningfully distinct, ordered by frequency of use. Power users get ⌘K; beginners get obvious labeled items.
6. **Separation of concerns in Account.** Configuration (who you are) is separate from commerce (what you pay) and from meters (what you've consumed).

---

## 2. Core mental model

Everything the user touches falls into four buckets:

```
WORK        → Compose          (writing + conversation — the product)
CAPABILITY  → Tools            (purpose-built single actions)
ASSETS      → Library          (prompts · tones · knowledge)
FIND        → Search           (retrieve anything)
META        → Account          (profile · appearance · notifications · billing · usage)
```

- **Work** is where users *spend* time.
- **Capability** is what users *invoke*.
- **Assets** are what users *build and reuse*.
- **Find** is what users *recall*.
- **Meta** is what users *rarely* touch.

Frequency argument for the ordering: 80% of sessions are Work, ~10% Capability, ~5% Assets, ~4% Find, ~1% Meta. The rail is ordered by frequency so the highest-frequency destinations are cheapest to reach (top = closest to the cursor, and top items map to 1-2 in ⌘K).

---

## 3. Navigation hierarchy

### 3.1 Primary rail (persistent, always visible, icon + label)

```
┌─────────────────────────────┐
│ ◆ Workspace switcher  [later]│  ← future org/team switcher (see §9)
│─────────────────────────────│
│ W   Compose    [home]        │
│ T   Tools                   │
│ L   Library                 │
│ S   Search                  │
│─────────────────────────────│
│ ▷   New Chat  (⌘N)          │
│ ⌘   Command Palette  (⌘K)   │
│ ⚙   Account                 │
└─────────────────────────────┘
```

- **Compose** — default landing after onboarding. Home. Active by default.
- **Tools** — the catalog of single-purpose actions.
- **Library** — prompts, tones, knowledge.
- **Search** — one global find surface.
- **Account** — profile, appearance, notifications, billing & usage, danger zone.

Why five: fewer than three and things get lumped together (the current bug); more than seven exceeds working-memory limits. Five distinct content buckets fit the "1–2–3" scan pattern and map 1:1 onto a mobile tab bar (§9).

Rules:
- The rail is always visible regardless of layout mode. Focus/writer modes hide the *conversation* sidebar, never the rail.
- New Chat is global: it creates a conversation and jumps to Compose. It is not buried inside Compose's sidebar.
- ⌘K is the accelerator layer — jump to any conversation, prompt, tone, tool, knowledge file, or Account page in one keystroke. It complements Search (find) by being *navigation*, not *search*.

### 3.2 Section-level navigation

- **Compose** — conversation sidebar is the sub-nav (Recent, Pinned, Favorites, grouped by Today/Yesterday/This Week/Older). A "Manage" toggle expands it into a full list with filters and bulk actions (see §6).
- **Tools** — category pill row → grid of tools. One level deep, no page navigation for opening a tool (opens inline, §6).
- **Library** — a sub-nav of three tabs: Prompts / Tones / Knowledge. Each tab is a list + detail.
- **Search** — scope tabs: All / Conversations / Messages / Prompts / Tones / Knowledge.
- **Account** — left sub-nav: Profile, Appearance, Notifications, Billing & Plan, Usage, Danger Zone.

### 3.3 Workspace mode switcher is not navigation

The existing Chat / Focus / Writer / Compact / Minimal switcher changes **layout density**, not content. It must not be re-labeled as a section. Rule: the mode switcher can hide panes; it cannot change *where things live*. This prevents the "two writing surfaces" trap.

---

## 4. Page hierarchy (sitemap)

```
/                          Marketing site (public)
├─ /onboarding             First-run: use case → default tone → optional knowledge
└─ /compose                WORK — the writing home            [was /chat]
   └─ /compose/:id         A conversation                     [was /chat/[chatId]]
/tools                     CAPABILITY — single-purpose actions [unchanged path]
/library                   ASSETS
   ├─ /library/prompts     Templates + saved prompts           [was dead component]
   ├─ /library/tones       Built-in tones + custom personas    [was Settings → Profile]
   └─ /library/knowledge   Uploaded reference docs             [NEW]
/search                    FIND — one global search            [unify page + overlay]
/account                   META
   ├─ /account/profile
   ├─ /account/appearance
   ├─ /account/notifications
   ├─ /account/billing     Plan, upgrade, manage subscription  [was /billing]
   ├─ /account/usage       Meters + limits                     [moved out of /billing]
   └─ /account/danger      Delete account
```

Deep-link rules: every asset has a stable URL (`/library/prompts/:id`) so it can be shared, bookmarked, or surfaced by ⌘K. Search results deep-link into the exact conversation, prompt, tone, or file.

---

## 5. Section rationales

### 5.1 Compose — why it exists
The product's job is transforming writing into a chosen voice. Compose is where that single recurring act happens. Everything else is fuel for this surface or records of work done here.

- The conversation sidebar is the closest, cheapest list of *work-in-progress*.
- The right "AI Context" drawer surfaces the current tone, model, and attached knowledge — the inputs that define the output. This is the only place a context toggle belongs.

### 5.2 Tools — why it exists
A significant share of users (especially power users) don't want a conversation — they want "rewrite this email professionally" done in one shot. The 40+ tools (rewrite, reply, social, email, business, career, dating, utility) are structured, single-purpose actions with a deterministic UI. Folding them into chat would bury them; folding them into Library would mix *capabilities* with *assets* (a prompt is something you invoke inside a tool, not the same thing as the tool). Tools remain a distinct, always-visible destination. Launching a tool **opens inline in the center pane**, never navigates away.

### 5.3 Library — why it exists
Reusable assets are a first-class value in any writing tool: you invest in a custom persona, a prompt that works, a corpus of brand reference material, and you want it *owned*, *curated*, and *reused* — not buried under account settings.

- **Prompts** — curated templates (the existing but orphaned `PromptLibrary` data) plus user-saved prompts. Categories mirror tool categories so the two surfaces stay conceptually aligned (Email → email tools/prompts, etc.). "Use" opens Compose preloaded with the prompt and tone — two clicks from idea to writing.
- **Tones** — built-in tones plus custom personas, which move here from Settings. Creating/editing a tone uses the same composer affordances, so the act of *defining a voice* is a writing act, not a settings chore. The composer tone picker reads from this tab.
- **Knowledge** — uploaded reference documents (the upload API and storage counters already exist; this is the missing surface). Knowledge files attach to a conversation from Compose's context drawer, or to a custom tone, so the AI has material to ground tone and content.

### 5.4 Search — why it exists
The current app has two overlapping search surfaces and neither spans content types. One destination, scoped tabs, no second overlay. The ⌘⇧F overlay is absorbed into this page; ⌘K remains the *navigation* accelerator (find a place) while Search is *retrieval* (find a thing — including inside messages).

### 5.5 Account — why it exists
Account is the rarely-touched, always-needed back office. Grouping profile + appearance + notifications is standard. The two substantive changes:

- **Personas leave Account.** Content creation is not configuration; it moves to Library → Tones.
- **Billing and Usage split.** A pricing/plan page is a *purchase decision*; usage meters are *telemetry*. On the same page they argue with each other (a happy paying user staring at "Manage subscription" and "plan: Free" simultaneously). Billing holds plan + upgrade + manage; Usage holds daily/hourly message limits, token spend, uploads, and storage. Usage is one click from Billing and cross-referenced in Compose when a limit approaches.

---

## 6. Workspace organization

### 6.1 The compose pane (work surface)

```
┌──────────┬───────────────────────────────┬──────────────┐
│ CONVERS. │    COMPOSE                    │  AI CONTEXT  │
│ (recent) │  conversation thread          │  tone · model │
│ pinned   │  ───────────────────────      │  knowledge   │
│ favs     │  composer                     │  summary     │
│ today    │  [tone bar]  [input]  [send]  │              │
│ ...      │                               │              │
│ [Manage] │                               │              │
└──────────┴───────────────────────────────┴──────────────┘
```

- **Left:** conversation list = Compose's sub-navigation. "Manage" expands it to a full browsable index (filter by pinned/favorited/archived/date/tone; bulk archive/delete; search) so heavyweight management leaves the hover context menu and gets a real home.
- **Center:** the thread. The composer's tone bar is the *primary* control — it is the product's defining input and stays one interaction from the cursor.
- **Right:** context drawer — current tone, model, and attached knowledge files. This is the home of the Knowledge attachment action (two clicks: open drawer → attach).

### 6.2 Tools pane
Category pills → grid of tool cards → **tool panel opens in place** (center pane). No URL change, no page swap, instant "back" (Escape or the grid's close affordance). A tool panel has: input, applied tone (defaults to the account default tone, overridable), output, and "send to conversation" (becomes a draft in the current Compose thread) — this is the single bridge between the Capability and Work buckets.

### 6.3 Library pane
Left sub-nav (Prompts / Tones / Knowledge) → list with a search/filter header → detail opens inline. All "create" actions live at the top of each tab (New Prompt, New Tone, Upload Knowledge). Nothing in Library ever opens as a *page*; it stays within the pane.

### 6.4 Empty states
Every section's empty state states one primary next action and links into Compose (e.g., Knowledge empty → "Upload a reference document" → which then offers "Attach it to a conversation"). Empty states are the first tutorial.

---

## 7. Onboarding alignment

Current onboarding is three steps (writing type, language, default tone). It already feeds the right defaults; the IA just makes the outputs land correctly:

1. **Use case** → pre-filters the Tools catalog and Prompt suggestions for that user's context (foundation for personalization, §9).
2. **Default tone** → pre-selects the composer tone bar and marks that tone "default" in Library → Tones.
3. **Optional knowledge** → seeds the Knowledge tab; the file is pre-attached to the first conversation.

Post-onboarding lands on **Compose**, not a marketing page. The rail is visible from the first screen so the user immediately learns the map of the product.

---

## 8. Click-count and cognitive-load verification

| Task | Before | After |
|---|---|---|
| Reach a writing tool | hover tiny sidebar icon → click | 1 rail click |
| Create a custom persona | Settings → Profile → Add Persona → fill 3 fields | Library → Tones → New Tone |
| Use a saved prompt | impossible (dead component) | Library → Prompts → Use → preloaded Compose |
| See usage / limits | buried under pricing cards on /billing | Account → Usage (1 click from Billing) |
| Find an old message | two competing surfaces | one Search page, scoped tabs |
| Attach a reference doc | impossible | Compose → context drawer → attach |

Cognitive load reductions:
- 5 always-visible, labeled destinations → no hunting, no learning.
- One canonical home per asset → no "where did I see that?" ambiguity.
- Billing no longer mixes purchase with telemetry → no decision conflict.
- Tool launch never navigates → no disorientation, always reversible.

---

## 9. Future expansion

The IA is designed to absorb growth without rework.

1. **Workspaces / Teams (B2B)** — the rail gains a workspace switcher at top (the placeholder ◆ in §3.1). Library becomes per-workspace (shared prompts, team tones, team knowledge); Account stays per-user. The existing Clerk org primitives slot in here.
2. **Shared galleries / marketplace** — Library tabs gain a "Community" source next to "Mine"; content model already keyed by id/type → sharing is a permission layer, not a new surface.
3. **Integrations (Gmail, Notion, GitHub)** — each integration is an import source into Library → Knowledge (a mailbox/workspace/repo is just a knowledge corpus). No new top-level destination.
4. **Automations** (scheduled rewrites, content pipelines) — a new `Capability` bucket item ("Automations") under Tools or as a sixth rail item once Work scales; the CAPABILITY bucket has headroom because Tools is a category, not a fixed grid.
5. **Mobile** — the five-destination rail collapses 1:1 into a bottom tab bar; Library's sub-nav becomes a top segmented control. No re-architecture needed.
6. **API / Developer platform** — lives under Account (a "Developer" sub-page with keys), consistent with "Account = account-level back office."
7. **Personalization** — the onboarding use-case signal (§7) feeds per-user Tool/Prompt ordering; the rail shape is untouched because ordering is content, not structure.

---

## 10. Implementation map (current → target)

| Current route | Target route | Change |
|---|---|---|
| `/chat` (empty-state page) | `/compose` (home) | repurpose as landing; sidebar is sub-nav |
| `/chat/[chatId]` | `/compose/:id` | path rename only |
| `/tools` | `/tools` | keep; add inline panels + "send to conversation" |
| `PromptLibrary.tsx` (dead) | `/library/prompts` | wire component into a route; add save/use |
| Settings → personas | `/library/tones` | move persona CRUD out of Settings |
| (none) | `/library/knowledge` | new route over existing upload API |
| `/search` + ⌘⇧F overlay | `/search` (unified, scoped) | drop overlay; add scope tabs |
| `/billing` | `/account/billing` + `/account/usage` | split marketing from telemetry |
| `/settings` | `/account/{profile,appearance,notifications,danger}` | add sub-nav; drop personas |
| — | Persistent rail | new shell-level nav applied across all dashboard routes |

Suggested build order: (1) persistent rail + relabel Compose, (2) move personas → Tones tab, (3) wire Prompt Library into Prompts tab, (4) Knowledge tab over existing upload API, (5) unify Search, (6) split Account/Billing/Usage. Each step is independently shippable and additive — no step breaks a live route.
