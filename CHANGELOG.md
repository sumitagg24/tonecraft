# Changelog

All notable changes to ToneCraft are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Git tags match `package.json` versions exactly.

## [Unreleased]

_No changes yet._

## [1.4.0] - 2026-08-08

### 🔒 LLM provider info fully hidden from users

No user can see which third-party model produced their results:

- **New neutral label system** (`src/lib/ai-labels.ts`) — raw model/provider IDs map to neutral labels (Fast / Premium / Standard Model, Cloud AI)
- **User Analytics** — "Model Usage" + "Provider Distribution" charts and their API fields removed (`/api/analytics/me`)
- **Admin + analytics routes** sanitized server-side (`admin/metrics/ai-usage`, `analytics/admin`, `analytics/ai`)
- **Chat studio** — no model in message bylines/metadata or tool-result chips; AI Context "Provider" row removed; `/api/tools` drops model/provider
- **Profile dropdown** — "Model" row + Gemini icon removed
- **Public pages scrubbed** — status page aggregates AI backends into one neutral "AI Services" row; share links, landing, changelog, help, FAQ, README de-leaked
- **Voice errors** no longer expose `OPENAI_API_KEY` in toasts

### 🎙️ Real voice input

- Browser voice-to-text (STT) in the composer — press the mic, speak, get transcribed text
- **Permissions-Policy `microphone=(self)`** — dictation was silently blocked for every user by `microphone=()` (real production bug, caught by e2e)
- Actionable error messages when voice isn't configured instead of a bare 502

### 🧪 QA hardening

- **Playwright hydration/console regression smoke** added to CI (zero console errors asserted)
- **Signed-in chat-flow smoke** — New Workspace → send message → copy button
- **Composer controls e2e** — tone picker, tool picker, voice dictation, edit + `(edited)` marker, regenerate (16/16 tests green)
- **429 rate-limit fix** — error code preserved so `isLimitError()` shows the upgrade toast instead of a raw console error
- **Client UI/UX polish** — hydration mismatches fixed, dead voice button removed, misleading composer placeholder corrected

### 🔧 Engineering

- Version aligned so the tag and `package.json` match exactly (v1.4.0)
- Clean working tree; dead-code check enforced in CI

### ✅ Validation

`npm run lint` 0 · `tsc --noEmit` 0 · `check:deadcode` clean · `npm run build` green · **Playwright 16/16**

## [1.1.4] - 2026-08-08

### Changed
- LLM provider info fully hidden from users (foundation of the v1.4.0 provider-neutral sweep)
- UI/UX polish sweep across landing, chat, tools, and public pages

### Added
- Playwright hydration/console regression smoke to CI
- Real voice input in the composer (browser STT)
- Signed-in chat-flow + composer-controls e2e tests

## [1.0.0] - 2026-08-02

### Added
- First stable milestone: multi-provider AI architecture, provider routing, credit-based usage, Paddle billing
- Modern chat interface, projects, prompt library, personas, knowledge base
- Search, notifications, export system, analytics dashboard
- Centralized validation, production hardening, documentation overhaul, testing infrastructure

[Unreleased]: https://github.com/sumitagg24/tonecraft/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.4.0
[1.1.4]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.1.4
[1.0.0]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.0.0
