# Changelog

All notable changes to ToneCraft are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Git tags match `package.json` versions exactly.

## [Unreleased]

### 🗑️ File storage (R2 / Backblaze B2) fully removed

- **Storage layer deleted** — `src/lib/storage.ts`, `src/app/api/upload/route.ts`, and `scripts/probe-r2.cjs` are gone; `@aws-sdk/client-s3` uninstalled. Chat attachments were the only consumer, and they're not needed for launch — knowledge-base files already live in Postgres
- **Paperclip attachment UI removed from the composer** — no dead button, no broken uploads (matches the "every button must work or be removed" UX rule)
- **Health check simplified** — `checkStorage` dropped; `/api/health` reports exactly the real providers (DB, Redis, AI, Clerk, Paddle)
- **Boot + env hygiene** — `startup-validation` no longer mentions storage; `STORAGE_*` vars removed from `.env.example`, README, `docs/PRODUCTION-CUTOVER.md`, `scripts/production-cutover.js`, and `.env.local`

### 🔒 Subscription access helper hardened (Paddle fulfillment)

- `PlanService.getPlan` now keeps **`past_due`** subscribers on their paid tier — Paddle retries payment for a grace period, so customers keep features mid-retry. Access is revoked only on actual cancellation/pause (`scheduled_change` never revokes). Matches the fulfillment spec's "only revoke when status is actually canceled"

## [1.5.0] - 2026-08-13

### 💳 Paddle payments are LIVE

End-to-end live checkout verified: Paddle hosted checkout opens in **live mode** on `tonecraft-psi.vercel.app` (real Pro plan, $6.00 with GST), with a live client token (`live_…`) baked into the production bundle.

- **Find-or-create Paddle customer by email** — repeated checkouts (the billing-page live probe, users whose DB row lost its provider customer ID) no longer hit `customer_already_exists`; parallel-race safe
- **Case-insensitive customer lookup** — Paddle lowercases emails but Clerk temp-user emails are mixed-case in the DB; exact-match misses are gone
- **Live client token deployed** — `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` regenerated via the Paddle API, pushed to Vercel, verified in the served bundle (no sandbox `test_` token leaks)
- **Paddle environment follows the API key** (not `NODE_ENV`) — sandbox keys authenticate against sandbox-api, live keys against api.paddle.com
- **Checkout overlay CSP fix** — `paddle.com` + hosted-checkout fallback whitelisted; ProfitWell analytics (`public.profitwell.com`) allowlisted so the overlay opens without console errors
- **Webhook plan activation + fallback price IDs** — subscription.updated/completed webhooks activate the right plan even when the price mapping lags
- **Live provisioning tooling** — `scripts/setup-live-paddle.js` (idempotent products/prices/webhook), `scripts/create-live-client-token.js`, `scripts/recheck-live-checkout.js` (onboarding + checkout probe)

### 🔐 Clerk auth fixed in production

- **Clerk `/__clerk` proxy through middleware** — clerk-js bundle now loads in production (the browser was 404ing the JS and refusing to execute HTML), so sign-in/sign-up actually mount
- **Auth-mount e2e** — asserts the Clerk UI (identifier/password fields + Continue) mounts on `/sign-in` and `/sign-up` across all four viewports, plus an optional sign-in form-submission check

### 📱 Mobile-first chat UI

- Mobile-first chat interface + reply tone fixes (v1.4.0 follow-through): composer controls, tone/tool pickers, message actions usable on touch screens

### 🧪 Viewport e2e suite (Android / iOS / tablet)

- **Mobile viewport Playwright projects** — Pixel 7 + iPhone 13 form factors added to CI as mandatory per-viewport gates
- **Tablet (iPad Pro 11, md range)** project covering the gap between phones and desktop
- **Responsive overflow spec** — auth-free public-page horizontal-overflow checks on every viewport
- **Billing/checkout spec** — `/billing` mount, bundle token↔build-config match, and the live checkout probe with a regression guard on duplicate-customer errors
- **Billing secrets wired into CI** — the billing spec runs on every PR when sandbox secrets + a real test `DATABASE_URL` are configured

### ✅ Validation

`npm run lint` 0 · `tsc --noEmit` 0 · `npm run build` green · **Playwright 64 passed / 27 skipped / 0 failed** across 4 viewports · Live checkout opens in production (browser-verified)

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
