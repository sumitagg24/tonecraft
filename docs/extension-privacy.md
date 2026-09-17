# ToneCraft extension — privacy disclosure

This document describes EXACTLY what the ToneCraft browser extension does
with data, so the Chrome Web Store privacy disclosure and any privacy
policy can quote it accurately. Implementation references are included.

## Single purpose

Rewrite, improve, and generate text where the user works, using their
ToneCraft account. (Store listing: Productivity.)

## What is processed, and when

| Data | When | Where it goes |
|---|---|---|
| Selected text (≤8000 chars) or composed idea (≤4000) | Only when the user clicks a ToneCraft action (floating button/panel, context menu, Alt+T panel, popup, side panel) | `POST` to `https://www.tonecraft.site/api/tools` or `/api/ai/assist` |
| Tone / length / language / instruction options | Same invocation | Same request |
| Clerk session credential (`__session` cookie value as Bearer) | Same invocation (re-read fresh each call) | `Authorization` header to the same API |
| Plan + usage counters | Popup/sidepanel open | `GET /api/subscription`, `/api/usage` (same API) |
| Page hostname + title (≤120 chars) | With an invocation (routing + context) | In-memory only; hostname sent as request metadata |

## What is NEVER collected

- Keystrokes or input monitoring (no listeners except `selectionchange`
  for the floating pill; no text is read until invocation).
- Full page contents, DOM snapshots, or background uploads.
- Passwords, payment/credit-card data, OTPs: `isSensitiveElement`
  (`extension/src/content/editors.ts`) excludes them by input type,
  `autocomplete` (`cc-*`, `current-password`, `one-time-code`, …) and
  label heuristics; unknown input types default to excluded.
- Browsing history, tabs list, or other sites' cookies (host permissions
  cover only `*.tonecraft.site`).

## Storage on device

- `chrome.storage.sync`: preferences only (site URL, default tone,
  floating-button/menu toggles, onboarding flag).
- `chrome.storage.local`: recent-tool metadata (tool id, timestamp,
  character counts) — never raw text.
- `chrome.storage.session` (memory-only, cleared on browser close):
  session token. No passwords or provider keys exist anywhere in the
  extension (AI provider keys stay server-side; generation runs on
  ToneCraft's backend through the user's plan limits).

## Third-party processing

User-invoked text is processed by ToneCraft's backend and its AI
providers under ToneCraft's website privacy policy/terms. The extension
adds no additional processors, no advertising SDKs, and no remote code
(all logic is packaged; only data APIs are remote).

## Retention / deletion

- Server generations follow the website's retention policy.
- On device: clear via options (toggle features off), remove recent
  metadata by clearing extension storage, full removal by uninstalling
  the extension (sync/local/session areas are deleted by the browser).
- Sign-out on the website invalidates the session the extension uses.

## Contact / support

Support and data requests go through the existing ToneCraft channels
linked from the extension (options page → My account; popup → Open
ToneCraft). No separate extension support desk or email is operated.
