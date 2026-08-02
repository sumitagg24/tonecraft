# Testing Strategy — 11

Date: 2026-08-02 · Scope: a roadmap for test coverage across the ToneCraft codebase. **Design only — nothing implemented.**

## Current state (measured)

- **Zero test files** — `find src -name '*.test.*' -o -name '*.spec.*'` returns nothing.
- **No test runner installed** — no vitest/jest/playwright/cypress in `node_modules/.bin`, no config files.
- **No CI** — no `.github/` directory; the only scripts are `dev/build/start/lint/db:*`.
- Repo at risk: **25,573 LOC** in `src/`, **89 components**, **46 API route handlers**, **25 hooks**, **16 services**, **10 engine files**, **6 repositories**, plus the AI pipeline and a Prisma schema with 25 models.

Given the AI cost surface (provider spend per call), the auth surface (Clerk), the DB (Neon/Prisma), and the interactive streaming UI, this is the **biggest single risk to launching** — a refactor (like the audit-01 dead-code cleanup) has no safety net.

## Proposed stack

| Layer | Tool | Why |
|---|---|---|
| Unit | **Vitest** + React Testing Library | Fast, TS-native, zero config friction with Vite/Next |
| API/integration | **Vitest** calling route handlers directly (`await GET/POST(req)` — Next 16 route handlers are plain functions) against a **test Postgres** (or a mock Prisma) | No HTTP server needed; tests the real auth/validation/ownership logic |
| e2e | **Playwright** | Auth flows (Clerk test mode), streaming, multi-route journeys |
| A11y | **axe-core** (via Playwright or jest-axe) | Mechanical WCAG regression checks |
| Perf | **Lighthouse CI** on the landing route | Web Vitals budgets (audit 03 P2-5) |

## The test pyramid mapped to this repo

### Layer 1 — Unit (fastest ROI, day 1)
Pure logic that needs no DB or network:
- `src/engine/IntentEngine` — intent resolution + defaults (pure).
- `src/engine/ContextBuilder` — persona/tone/knowledge/history assembly, tone map, history slicing.
- `src/engine/ResponseFormatter` — output structure.
- `src/lib/knowledge/chunk.ts` + `extract.ts` — chunk boundaries, text extraction, file-type handling.
- `src/config/models.ts` + `credits.ts` + `plans.ts` — tier/credit math, duplicate-ID guard (startup-validation already checks — test it).
- `src/lib/ratelimit.ts` — window math with a mocked Redis.
- `src/lib/utils.ts` — the one live helper (`cn`), plus any promoted helpers.
- `src/prompts/*` — template rendering with variables.
- New `src/lib/validators.ts` (audit 08-R3) — zod schema round-trips.
- `use-chat.ts` / `use-draft.ts` store logic — with a mocked `fetch`/localStorage.

### Layer 2 — Integration (repositories, services, API routes)
- **Repositories** against a real test Postgres (Neon branch or local): `ChatRepository.findByIdAndUser`, `MessageRepository` ownership (the C1–C3 regression suite!), `ProjectRepository`, `PromptRepository`, `UsageRepository`.
- **Services**: `UsageGuard` credit math + `FOR UPDATE` race test; `NotificationService` pref-gating; `KnowledgeService` create/delete; `SearchService` scoping (a user must never see another user's rows — the audit-06 IDOR lessons encoded as tests).
- **API routes**: call handlers directly with a mocked `auth()` + seeded DB. Cover: 401 without session, 404 non-owned resource, zod 400s, success shapes. This is where the `withApiHandler` refactor (audit 08-R4) pays off — one wrapper, one test suite.

### Layer 3 — e2e (Playwright)
Critical journeys (Clerk test mode for auth — see the clerk-testing skill):
1. Landing → `/chat` (redirect after sign-in).
2. Send a message → stream renders → message persists on reload.
3. Regenerate/continue/edit/feedback (the P0-3/P3-4 broken-path fixes).
4. Export (all 4 formats) → file download; share link → share page.
5. Knowledge upload → "Document indexed" notification → grounded answer cites the file.
6. Command palette (keyboard-only), tools grid (keyboard-only — regression for a11y C1), settings notification toggles.
7. axe scan on `/tools`, `/chat`, `/library`, command palette, and a modal (regression for audit-04 findings).

### Layer 4 — AI testing (the part generic advice forgets)
The engine is testable **because providers are injected through `ProviderRouter`** — construct it with fake provider clients:
- **Golden tests**: fixed intent+tone+platform → assert the composed system prompt and message list (snapshot the *prompt construction*, never the model output).
- **Provider fixtures**: mock `streamText` with scripted chunk sequences (normal, mid-stream error, 429 then success) → assert failover, credit pre-check/record, error message shape (audit 10-A8).
- **Cost tests**: `UsageGuard` with allowance edges (0 remaining, exact cost, over-limit race).
- **Prompt regression**: when prompt templates change, run the golden suite to catch accidental behavior drift.
- **Eval harness (post-launch)**: a labeled eval set + LLM-judged or rubric scores, run weekly, not in CI (cost).

### Layer 5 — Perf & visual
- Lighthouse CI budget on `/` (LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms).
- Optional Playwright screenshot diffs after the audit-07 polish pass.

## CI automation (GitHub Actions — none exists today)

```yaml
# .github/workflows/ci.yml (sketch)
name: CI
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: postgresql://...  # test DB / Neon branch
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint            # exists
      - run: npx tsc --noEmit        # exists today, wire it in
      - run: npx prisma generate
      - run: npx prisma migrate deploy   # test DB
      - run: npm test                # vitest run
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
  lighthouse:
    runs-on: ubuntu-latest
    steps: [ build, run Lighthouse CI on preview URL ]
```

Scripts to add to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`, `"e2e": "playwright test"`.

## Priorities by ROI

| Phase | What | ROI | Blocks on |
|---|---|---|---|
| 1 | Vitest + unit tests for engine/prompts/credits/config | Highest — pure logic, no infra, catches the drift in audit-10 A1/A9 immediately | Installing Vitest (~5 min) |
| 2 | `withApiHandler` refactor + API route tests | High — encodes auth/ownership/error-shape contracts, locks audit-08/06 fixes | Audit-08 R4, R5 |
| 3 | Repository/Service integration tests w/ test Postgres | High — the IDOR regression suite (audit-06 C1–C3) | Test DB provisioning |
| 4 | Playwright e2e core journeys + axe | High — user-visible regressions, a11y gate | Clerk test mode setup |
| 5 | AI golden + provider-fixture tests | Medium — protects the most expensive surface | A fake provider harness (~half day) |
| 6 | Lighthouse CI + visual diffs | Medium (guardrail) | CI running (phase 4) |

**Quick win on day 1:** wire `npx tsc --noEmit` and `npm run lint` into CI **today** (both already pass locally — audit 02 verified `tsc` is green), before any test infra exists. That alone stops silent type/lint regressions on every PR.

## Notes / risks

- **Clerk in e2e**: use Clerk's test-mode/token-based testing (see `clerk-testing` skill) rather than driving the real UI; flaky-auth e2e is worse than none.
- **Streaming tests**: keep AI SDK behind the router injection point; never hit real providers in CI (cost + flake).
- **DB tests**: use a dedicated Neon branch or a local Postgres; never the production DB. `prisma migrate deploy` in CI keeps schema drift visible.
- **Don't test what audit 01 removes**: write tests for the *surviving* components only, or the dead-code cleanup gets blocked by phantom coverage.
