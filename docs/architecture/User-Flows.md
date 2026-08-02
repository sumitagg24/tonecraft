# User Flows

> End-to-end journeys. Each flow is a decision of record: the user's starting
> context, steps, and the single destination they land on. Flows drive the
> click-count and empty-state designs.

## 1. New user (acquisition → first value)

```
Landing ──► Sign Up ──► Onboarding ──► Compose ──► First Result ──► (Upgrade)
   │                        │            │              │
   │                        │            │              └─► free limit hit ──► Upgrade prompt
   │                        │            │                   (account/billing)
   │                        │            └─► empty state:
   │                        │                "New Chat" / guided prompt
   │                        │
   │                        └─► Step 1: writing type   (pre-filters Tools + Prompt suggestions)
   │                            Step 2: language       (default)
   │                            Step 3: default tone   (marks tone default in Library → Tones)
   │
   └─► Hero playground → Pricing → Sign up (or go straight to Compose)
```

Decision: onboarding stays **optional** (a "Skip" affordance). Enforcing it adds
friction before value. But post-onboarding **must** land on Compose, and the
rail must be visible from the first authed screen so the map teaches itself.
Onboarding outputs (type, language, tone) seed the composer defaults.

First-result journey inside Compose:
```
Compose → New Chat → composer tone bar (pre-seeded) → first prompt
       → streamed result → inline actions (copy / regenerate / tone again)
       → optional: "Attach knowledge" via context drawer
```

## 2. Returning user (login → resume work)

```
Login ──► Compose (last conversation active) ──► Continue writing
       │
       └─► sidebar: resume a different conversation (Pinned / Favorites / grouped)
       └─► ⌘K: jump to any conversation by title
       └─► Export / Share from section header
```

Priority ordering in the sidebar: pinned > favorites > this-week > today >
yesterday > older — the *needed* thread is above the fold. No "history page"
needed: the sidebar *is* history. `/chat` index empty state is replaced by
Compose's own empty state.

## 3. Power user

```
Compose ──► Search (⌘⇧S or /search): find an old message ──► deep-link to thread
        ──► Tools: rewrite/email/social in one shot ──► "send to conversation"
        ──► Library: apply a saved tone ──► tone bar ──► generate
        ──► Library: reuse a saved prompt ──► Compose preloaded
        ──► Knowledge: attach a brand doc ──► context drawer ──► grounded output
        ──► Keyboard-first: ⌘K everywhere, ⌘1–4 rail, ⌘B/⌘\ panes
```

## 4. Tone & persona management

```
Library → Tones → (New Tone | edit) → define voice → saved
        → composer tone bar picks from Tones → generate
        → Settings no longer lists personas (removed from Account)
```

## 5. Prompt workflow

```
Library → Prompts → browse category → Use → Compose preloaded (prompt + tone)
       → edit → generate
       → save as prompt: composer action → Library → Prompts (My saves)
```

## 6. Billing & usage

```
Upgrade path:  Compose limit banner ──► /account/billing ──► Paddle checkout ──► success → Pro
Manage path:   /account/billing ──► "Manage subscription" ──► Paddle portal
Consumption:   /account/usage (meters) ← one click from Billing
```

Free → Pro decision moment is the limit banner in Compose, not a marketing
interrupt. The banner links to Billing; Billing never argues with meters.

## 7. Mobile flows

| Flow | Steps |
|---|---|
| Resume work | Open app → bottom tab bar → Compose → drawer (sidebar) → pick conversation |
| Write | Compose → composer → tone bar (inline sheet) → send |
| Use a tool | Tools tab → grid → full-screen sheet panel → result → send to conversation |
| Find something | Search tab → scoped input → result → deep-link |
| Account | Account tab → nested list → billing/usage/profile |
| New chat | New Chat bar above tab bar → jumps to Compose |

Mobile chrome changes (`Navigation-Map.md` §6) — the *flows* are identical to
desktop because the buckets are the same five.

## 8. Exit & data flows

```
Delete conversation:  sidebar context menu → Delete → confirm → back to Compose empty
Archive:              sidebar context menu → Archive → moves to archived filter (restorable)
Delete account:       Account → Danger → confirm (typed) → /api/user/delete → signed out
```

Archive is reversible from the UI (it must be — current UI cannot un-archive).
Destructive actions confirm first.

## 9. Anti-flows (explicitly removed)

| Today | Decision |
|---|---|
| Reach a tool via tiny bottom icon row | killed — rail, one labeled click |
| ⌘⇧F overlay + /search both searching | killed — one Search section |
| "History" quick action → /chat index | killed — sidebar is history |
| Personas buried in Settings → Profile | killed — Library → Tones |
| Attach file/voice buttons that do nothing | killed or made real (`UX-Principles.md` #1) |
| "(/) for commands" hint | killed until a command system exists |
