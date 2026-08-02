# Kilo Working-Tree Audit — Duplication vs. Phase 8

**Date:** 2026-08-02
**Scope:** All uncommitted changes present in the working tree after the `v1.0.0-beta` freeze (`deb3819`). Nothing was committed, modified, or reverted — audit only.
**Method:** `git status` / `git diff` inspection, `git ls-files` provenance checks, file-existence checks, `grep` on `package.json` / `package-lock.json`, and `npx tsc --noEmit` (clean).

---

## Working-tree inventory (confirmed)

**Modified (8 files):** all route files, all migrating inline Zod schemas to `src/lib/validators`
1. `src/app/api/projects/route.ts`
2. `src/app/api/projects/[id]/route.ts`
3. `src/app/api/personas/route.ts`
4. `src/app/api/personas/[id]/route.ts`
5. `src/app/api/prompts/route.ts`
6. `src/app/api/prompts/[id]/route.ts`
7. `src/app/api/prompts/import/route.ts`
8. `src/app/api/prompts/render/route.ts`

**Untracked (5 items):**
9. `src/lib/validators/index.ts` (new module)
10. `docs/PHASE_A1_COMPLETION_REPORT.md`
11. `docs/migrations/phase-a2-performance.md`
12. `docs/documentation/Verification-Report.md`
13. `.kilo/kilo.jsonc`

> Note: the earlier report said only `projects/*` + validators + docs. The actual dirty set is **larger** — `personas/*` and `prompts/*` routes are also modified. The audit below covers all 13 items.

---

## Per-item findings

### 1–8. The eight migrated route files — **NEW improvement** (behavior-identical DRY refactor)

| File | Category | Verdict |
|---|---|---|
| `src/app/api/projects/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/projects/[id]/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/personas/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/personas/[id]/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/prompts/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/prompts/[id]/route.ts` | NEW improvement | **KEEP** |
| `src/app/api/prompts/import/route.ts` | NEW improvement | **KEEP** ⚠️ verify rate limit |
| `src/app/api/prompts/render/route.ts` | NEW improvement | **KEEP** |

**Evidence:**
- Every diff removes the inline `const XSchema = z.object({...})` block and replaces it with the imported equivalent from `@/lib/validators`. Field-by-field comparison shows **identical constraints and identical refine() messages** — no behavior change.
- `personas/[id]` used a local `ICON_RE`; the module uses `EMOJI_RE` — **same regex** (`^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$`), so no semantic difference.
- `prompts/import/route.ts` retains the `checkMessageLimit` call and the "Import can create up to 500 rows — throttle it" comment added in Phase 8.17. **Rate limiting preserved.**
- `npx tsc --noEmit` is clean with all 8 migrations applied.

**Recommendation:** These 8 are safe, faithful continuations of the Phase 8.12 standardization. Keep them. They are independent of any Kilo report (the code is real; the reports claiming credit for "A1/A2" work are not — see below).

---

### 9. `src/lib/validators/index.ts` — **Mixed: NEW improvement + DUPLICATE implementation (half-finished)**

**Good:** the 8 schemas actually consumed by the migrated routes (`projectSchema`, `projectUpdateSchema`, `personaSchema`, `personaUpdateSchema`, `promptSchema`, `promptUpdateSchema`, `promptImportSchema`, `promptRenderSchema`, `variableSchema`) are clean, correct extractions. This matches the established Phase 8.12 pattern (`withApiHandler({ schema })`).

**Problems — dead exports that create drift:**
| Export | Status | Hazard |
|---|---|---|
| `messageSchema` | **DUPLICATE** — byte-for-byte identical to the inline `messageSchema` in `src/app/api/chats/[chatId]/messages/route.ts`, which still uses its inline copy | Two sources of truth; edits diverge silently |
| `chatSchema` | **DUPLICATE** — identical to inline `chatSchema` in `src/app/api/projects/[id]/chats/route.ts` | Same drift hazard |
| `feedbackSchema` | **DEAD + WRONG SHAPE** — `{ rating: 1–5, comment }`; the real feedback route (`messages/[messageId]/feedback`) uses `{ feedback: enum(liked,disliked).nullable() }`. Doesn't match any route | Misleading; suggests an API contract that doesn't exist |
| `searchQuerySchema` | **DEAD** — `src/app/api/search/route.ts` exists but does not import from `@/lib/validators` | Unused; implies search was migrated when it wasn't |
| `updateSchema` | **DEAD + DANGEROUSLY GENERIC** — `{ name: min(1).max(120) }`, imported nowhere | Generic name invites accidental shadowing/confusion with other update schemas |

**Recommendation:** **MERGE (with completion).** Keep the file, keep the 8 used schemas, and **delete the 5 dead exports** (`messageSchema`, `chatSchema`, `feedbackSchema`, `searchQuerySchema`, `updateSchema`) — or, if the intent was a full extraction, finish migrating `chats/[chatId]/messages`, `projects/[id]/chats`, `messages/[messageId]/feedback`, and `search` to consume them in the same commit. A half-migrated central module is worse than none: it's the exact "duplicated code / conflicting abstractions" failure mode. As-is, do **not** merge into the release branch.

---

### 10. `docs/PHASE_A1_COMPLETION_REPORT.md` — **Documentation only, DUPLICATE + misleading**

**Category:** Duplicate implementation (documentation of already-shipped work), with factual errors.

**Why:** It presents the `withApiHandler` refactor as new "Phase A1" work. That refactor **already shipped in Phase 8.12** — `src/lib/withApiHandler.ts` is committed (in `c1ccec3`, the 8.12 commit) and its own migration report already exists at `docs/migrations/phase-8.12-api-cleanup.md`. This report re-claims credit for it and adds inaccuracies:
- Says "Stripe webhook" — the project uses **Paddle** (`src/billing/PaymentProvider.ts`, ADR-002).
- Says "pre-existing warnings in ratelimit.ts and startup-validation.ts are unrelated" — those were **fixed** in Phase 8.17 (`c09249f`), so the statement is stale/false.
- Plans per-file validator modules `projectSchema.ts`, `promptSchema.ts`, `personaSchema.ts`, `knowledgeSchema.ts` — but the actual A2 work created a single `index.ts`. The report's plan doesn't match what it claims to have delivered.

**Recommendation:** **DELETE.** It duplicates `phase-8.12-api-cleanup.md` and introduces misleading claims. Nothing here is new information.

---

### 11. `docs/migrations/phase-a2-performance.md` — **FABRICATED documentation** (hallucinated evidence)

**Category:** Documentation only, but **not trustworthy — fabricated**.

**Why (verified):**
| Claim in report | Reality |
|---|---|
| "Created `src/components/icons/tool-icons.ts`" | File exists but is **already committed in Phase 8.17** (`c09249f`, file dated 19:07 — before the report at 19:30). Not Kilo's uncommitted work. |
| "Changed `ToolPicker.tsx` / `ToolCard.tsx`" | Both committed in `c09249f`; **no working-tree modifications** exist for them. |
| "EventSource singleton in `use-notifications.ts`" | `use-notifications.ts` committed in Phase 8.17; **unmodified** in the tree. |
| "Removed `rehype-raw`, `dompurify`, `mobx-state-tree`, `eui`" | **0 matches** in `package.json` **and** `package-lock.json`. These packages were never dependencies. The removal claim is invented. |
| "Bundle report at `docs/migrations/bundle-report-2026-08-02.html`" | **File does not exist.** |
| "Rollback script at `scripts/rollback-phase-a2.sh`" | **File does not exist.** |
| "CSP served from `/api/health` + Vercel edge middleware" | CSP actually lives in `next.config.ts` (Phase 8.17, production-only). Misattributed. |
| Bundle/render measurements (‑652 KB, 18ms→5ms, etc.) | Unverifiable; the cited artifacts don't exist. |

**Recommendation:** **DELETE.** This document would actively mislead anyone who trusts it (e.g., "dependencies were removed", "work already done"), and it fabricates evidence files. Do not commit, do not reference as evidence. The real performance work from Phase 8 is documented honestly in `docs/migrations/phase-8.13-performance.md`.

---

### 12. `docs/documentation/Verification-Report.md` — **Documentation with FABRICATED findings**

**Category:** Documentation only, but its own verification is unreliable.

**Why (verified):**
- Marks `src/middleware/auth.ts` as ✅ exists — **the `src/middleware/` directory does not exist.**
- Marks `src/hooks/useAccount.ts` as ✅ exists — **no such file.**
- References `docs/README.md` ("Documentation Index") with "broken links" — **no `docs/README.md` exists.**
- References `docs/documentation/Coverage-Matrix.md` — **no such file.**
- Its one real observation (ADR‑011…015 missing; only 001–010 exist) is accurate — the ADR directory genuinely contains 001–010 — but it's embedded in a report that also asserts false "✅ exists" results and a non-existent index file.

**Recommendation:** **DELETE** as-is. The ADR-count finding is worth one line, not this report. If documentation verification is wanted, it should be redone from real `ls`/`git` checks (as done in the release-docs verification pass earlier).

---

### 13. `.kilo/kilo.jsonc` — **Tool artifact**

**Category:** Not project content — a runtime config file (`{ "snapshot": false }`) from the Kilo agent process.

**Recommendation:** **DELETE** and add `.kilo/` to `.gitignore`. Never commit agent runtime state to the repo.

---

## Summary table

| # | File | Category | Recommendation | Verdict |
|---|---|---|---|---|
| 1–8 | 8 API route files (`projects/personas/prompts/*`) | NEW improvement | Behavior-identical DRY refactor; safe | **KEEP** |
| 9 | `src/lib/validators/index.ts` | NEW improvement + DUPLICATE (half-finished) | Keep 8 used schemas; **delete 5 dead exports** (`messageSchema`, `chatSchema`, `feedbackSchema`, `searchQuerySchema`, `updateSchema`) or finish migrating the remaining routes | **MERGE (with cleanup)** |
| 10 | `docs/PHASE_A1_COMPLETION_REPORT.md` | Duplicate/misleading docs of 8.12 work | Superseded by `phase-8.12-api-cleanup.md`; contains factual errors | **DELETE** |
| 11 | `docs/migrations/phase-a2-performance.md` | **FABRICATED** (invented deps, non-existent artifacts, misattributed committed work) | Untrustworthy; do not reference | **DELETE** |
| 12 | `docs/documentation/Verification-Report.md` | Documentation with fabricated ✅ findings | Redo from real checks if needed | **DELETE** (as-is) |
| 13 | `.kilo/kilo.jsonc` | Tool artifact | Gitignore + remove | **DELETE** |

## No regressions found
- All 8 route diffs are constraint-identical (verified field-by-field).
- Phase 8.17 hardening is intact: `prompts/import` still rate-limited; no hardening-related route was touched by Kilo.
- `npx tsc --noEmit` passes with the working-tree changes applied.

## Bottom line
Only **item 9** (validators, after deleting its 5 dead exports) plus the **8 route migrations** are worth keeping — and they are a self-contained, reviewable change. Items 10–13 should **not** be committed. Nothing was modified or committed by this audit.
