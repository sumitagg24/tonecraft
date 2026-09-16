# Changelog

All notable changes to ToneCraft are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Git tags match `package.json` versions exactly.

## [Unreleased]

### 🗑️ File storage (R2 / Backblaze B2) fully removed

- **Storage layer deleted** — `src/lib/storage.ts`, `src/app/api/upload/route.ts`, and `scripts/probe-r2.cjs` are gone; `@aws-sdk/client-s3` uninstalled. Chat attachments were the only consumer, and they're not needed for launch — knowledge-base files already live in Postgres
- **Paperclip attachment UI removed from the composer** — no dead button, no broken uploads (matches the "every button must work or be removed" UX rule)
- **Health check simplified** — `checkStorage` dropped; `/api/health` reports exactly the real providers (DB, Redis, AI, Clerk, Dodo)
- **Boot + env hygiene** — `startup-validation` no longer mentions storage; `STORAGE_*` vars removed from `.env.example`, README, `scripts/production-cutover.js`, and `.env.local`

### 🔒 Subscription access helper hardened (Dodo fulfillment)

- `PlanService.getPlan` now keeps **`past_due`** subscribers on their paid tier — Dodo retries payment for a grace period, so customers keep features mid-retry. Access is revoked only on actual cancellation/pause (`scheduled_change` never revokes). Matches the fulfillment spec's "only revoke when status is actually canceled"

## [1.5.0] - 2026-08-13

### 💳 Dodo Payments billing is LIVE

End-to-end live checkout verified: Dodo hosted checkout opens in **live mode** on `www.tonecraft.site`, backed by the live Dodo catalog (Pro $5/mo, Advanced $15/mo, annual at 20% off). Subscriptions sync through `/api/webhooks/dodo` and entitlements activate in the database.

- **Webhook payload normalization** — Dodo wraps resources under `data`; the handler unwraps it so `subscription.active` / `payment.succeeded` events actually sync the plan (previously fields were read from the top level and subscriptions silently stayed Free)
- **UserId from checkout metadata, with email fallback** — accounts resolve even when renewal events don't echo the session metadata
- **Annual products** — separate `*_ANNUAL` products in the Dodo catalog; the annual toggle only renders when they're configured, and the webhook maps them to the same plan grant (no silent monthly fallback)
- **Webhook plan activation** — subscription events activate the right plan; payment events without a product id preserve the existing plan
- **Dodo environment follows the API key** (`live_mode` / `test_mode`) — sandbox keys hit the sandbox host, live keys hit the live host
- **Checkout CSP fix** — `checkout.dodopayments.com` + hosted-checkout domains allowed so the overlay/redirect opens without console errors
- **Sandbox E2E harness** — `scripts/dodo-sandbox/` drives plan → checkout session → test-card payment → webhook → entitlement sync without touching the live merchant

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

`npm run lint` 0 · `tsc --noEmit` 0 · `npm run build` green · **Playwright 64 passed / 27 skipped / 0 failed** across 4 viewports · Live Dodo checkout opens in production (browser-verified)

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
- First stable milestone: multi-provider AI architecture, provider routing, credit-based usage, Dodo Payments billing
- Modern chat interface, projects, prompt library, personas, knowledge base
- Search, notifications, export system, analytics dashboard
- Centralized validation, production hardening, documentation overhaul, testing infrastructure

[Unreleased]: https://github.com/sumitagg24/tonecraft/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.4.0
[1.1.4]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.1.4
[1.0.0]: https://github.com/sumitagg24/tonecraft/releases/tag/v1.0.0

