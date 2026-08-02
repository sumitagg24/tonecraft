# Personas 2.0 — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.3.
> **Depends on:** Compose (built). The current `Persona` model (name,
> description, systemPrompt, icon, color) already exists; this spec upgrades it
> to a full voice definition and adds picker/CRUD/import-export.

---

## 1. Purpose

Move from "Create Persona" (a bare prompt field) to **Choose Persona** — a
first-class voice picker with curated archetypes:

```
Choose Persona
    ├── Writer
    ├── Sales
    ├── CEO
    ├── Teacher
    └── Custom…
```

Every persona is a complete communication voice:

```
prompt            system prompt defining the voice
tone              default ToneCraft tone
temperature       creativity 0–100
emoji usage       never | minimal | moderate | heavy
writing style     concise | descriptive | persuasive | technical | storytelling
platform defaults per-platform tone/length overrides (email, LinkedIn, X, …)
```

Selecting a persona instantly reconfigures the composer: tone button, advanced
controls, and (where applicable) platform defaults all reflect the persona.

---

## 2. User flow

```
Composer persona chip (or sidebar)
    │
    ├── Open picker
    │    ├── Favorites (starred, pinned first)
    │    ├── Recent
    │    ├── Curated archetypes (Writer, Sales, CEO, Teacher…)
    │    ├── My personas
    │    └── "+ New persona"
    ├── Select → composer reconfigures (tone/temp/emoji/style/platform)
    ├── Edit → persona editor
    │         ├── Basics (name, emoji/icon, color, description)
    │         ├── Voice (system prompt, tone, temperature, emoji, style)
    │         ├── Platform defaults (per-platform tone/length)
    │         └── Preview (sample output with current settings)
    └── Manage → duplicate, favorite, set default, export, import, delete
```

### Persona editor flow

1. Choose name + visual identity (emoji, color).
2. Write/refine the system prompt (with a "suggest improvements" AI helper).
3. Set tone, temperature slider, emoji usage, writing style.
4. Optionally set platform defaults (e.g., LinkedIn → professional + long;
   X → witty + short).
5. **Preview:** type sample text → see the persona's voice render live.
6. Save (draft autosaves per 8.8).

---

## 3. Persona picker

- Triggered from the composer (next to the tone button) and the sidebar.
- Keyboard-first: type-ahead filters; arrow keys navigate; Enter selects.
- Grid + list toggle: compact list (avatar + name) or rich grid (avatar, name,
  description, platform badges).
- **Favorites** (starred) persist in localStorage *and* server-side (8.3 adds
  a server field) — cross-device.
- **Recent** mirrors the tone picker pattern (last-used, capped).
- A **default persona** (server-persisted on `User`) is auto-applied when
  opening a new chat; project default overrides (8.2).

---

## 4. Persona CRUD

| Action | UX | Persistence |
|---|---|---|
| Create | Editor + curated templates | `Persona` row |
| Read | Picker + library page | `GET /api/personas` |
| Update | Editor with autosave | `PATCH /api/personas/[id]` |
| Delete | Confirm dialog (soft-delete) | `DELETE /api/personas/[id]` |
| Duplicate | One click | copy row |
| Set default | One click | `User.defaultPersonaId` |
| Favorite | Star toggle | server + localStorage |

Deleting a persona used by chats: chats keep their last-applied tone (snapshot
already in message data); the persona link becomes `null` gracefully.

---

## 5. Import / Export

- **Export:** one persona → JSON (`{name, emoji, color, systemPrompt, tone,
  temperature, emojiUsage, style, platformDefaults}`); all personas → a single
  JSON bundle (or `.zip` for premium).
- **Import:** paste JSON / drop file; validate schema; conflict resolution
  (overwrite vs duplicate).
- Share a persona by copy-link (embed in URL, client-decodes) — no server
  dependency, MVP-friendly.

---

## 6. Platform defaults

A persona can carry per-platform overrides so one voice adapts across
channels:

```
platform  tone         length    emoji
email     professional medium    never
linkedin  professional long      minimal
twitter   witty         short     heavy
```

When a message targets a platform (existing `context.platform`), the persona's
platform defaults take precedence over global persona settings; message-level
tone selection still wins last. This composes with the existing tone/platform
system rather than replacing it.

---

## 7. Personas + Projects (8.2)

- Personas are **global** or **project-scoped** (`projectId`).
- Project personas appear only inside the project; project default persona
  overrides the user default when composing in that project.
- Team personas (8.7) are shared project personas with `editor` visibility.

---

## 8. Database changes (design)

```prisma
model Persona {
  id              String    @id @default(cuid())
  userId          String
  projectId       String?   // 8.2 scoping
  name            String
  description     String?
  emoji           String?
  color           String    @default("#6366F1")
  systemPrompt    String
  tone            String    @default("professional")
  temperature     Int       @default(70)     // 0–100
  emojiUsage      String    @default("moderate") // never|minimal|moderate|heavy
  writingStyle    String    @default("standard") // concise|descriptive|persuasive|technical|storytelling|standard
  platformDefaults Json?    // { email: {tone,length,emoji}, ... }
  isDefault       Boolean   @default(false)
  isFavorite      Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, projectId])
  @@index([userId, isFavorite])
}
```

`User` gains `defaultPersonaId String?`. The existing columns
(`description`, `systemPrompt`, `icon`) are migrated into the new shape
(`icon` → `emoji`, new optional columns added with defaults).

---

## 9. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/personas` | List user personas (global + project-scoped) |
| POST | `/api/personas` | Create persona |
| GET | `/api/personas/[id]` | Detail |
| PATCH | `/api/personas/[id]` | Update voice/settings/favorite/default |
| DELETE | `/api/personas/[id]` | Delete (soft) |
| POST | `/api/personas/import` | Import JSON bundle |
| GET | `/api/personas/export` | Export all as JSON |
| GET | `/api/personas/curated` | Curated archetype catalog (server-driven) |

`PATCH` accepts partial updates; optimistic UI mirrors `use-chat` patterns.

---

## 10. Frontend architecture

- **`PersonaPicker`** — popover/bottom-sheet (reuses `PickerSurface`):
  favorites, recent, curated, mine, new.
- **`PersonaEditor`** — full-screen or modal editor with voice sliders, live
  preview, platform-default table.
- **`PersonaChip`** — composer chip showing active persona (emoji + name,
  reconfigures tone/etc. on select).
- **`PersonaLibrary`** — `/library/personas`: grid of my personas, CRUD,
  import/export buttons.
- **`usePersonas` hook + personas in `chat-store`** — `selectedPersona` already
  exists in the store; wire it fully (see known gap in AGENTS.md).
- **Composer integration:** selecting a persona sets `tone`, `temperature`
  (creativity), and platform defaults in `chat-store.context` — no new
  streaming path required.

---

## 11. Security

- Personas are user-scoped; project personas enforce membership (8.2/8.7).
- Imported JSON is schema-validated; prompts are length-capped (e.g., 4,000
  chars) to prevent abuse.
- System prompts are treated as *data* injected into the fixed instruction
  framing (no arbitrary system-prompt injection outside the persona block).

---

## 12. Future improvements

- AI-assisted persona generation ("describe the voice you want" → draft).
- Persona marketplace (community-shared personas).
- Persona analytics (which voices get the best feedback scores).
- Voice cloning/length adaptation using the persona + knowledge.
- Team persona templates with locked fields (admin-controlled).
