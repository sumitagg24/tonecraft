# Extension permissions — what and why

Source of truth: `extension/manifest.base.json` (generated manifests must
match; `extension/scripts/validate.mjs` enforces the allowlist).

## API permissions

| Permission | Why | Could it be narrower? |
|---|---|---|
| `storage` | Sync preferences (base URL, tone, toggles, onboarding) + local recent-tool metadata. | No — this is the settings API. |
| `contextMenus` | The `ToneCraft` right-click submenu (user-toggleable in options). | No. |
| `cookies` | Read **only** the site's own `__session` cookie to authenticate API calls as the signed-in user. Never read/written for any other domain (host permissions forbid it). | Alternative (`identity` + OAuth flow) would add a second auth system; rejected — Clerk session reuse is safer and simpler. |
| `sidePanel` | Chrome/Edge side-panel workspace. Absent on Firefox (uses `sidebar_action` instead). | No. |

Deliberately NOT requested: `tabs` (only `activeTab`-equivalent messaging via
`tabs.query({active:true})` + `sendMessage`, which needs no permission),
`scripting`, `debugger`, `history`, `bookmarks`, `webNavigation`,
`management`, `identity`, `unlimitedStorage`.

## Host permissions (API only)

`https://www.tonecraft.site/*`, `https://tonecraft.site/*` — the first-party
API. Required for (a) authenticated fetches, (b) reading the first-party
session cookie, (c) Chrome's host-permission CORS bypass for those origins.
No third-party hosts. No AI provider hosts (keys stay server-side).

## Content-script matching (`https://*/*`, `http://*/*`)

This is the one broad surface, and it is required by the product's core
purpose: ToneCraft works "everywhere you type" (LinkedIn, Gmail, Slack,
arbitrary sites). There is no narrower match pattern that covers arbitrary
user-chosen websites.

Minimizations in place:
- Scripts run at `document_idle`, top frame only (`all_frames: false`).
- The content script is a small bundle (~30 KB) with **zero network calls
  on load** — it only observes selection locally.
- **Nothing leaves the page until the user invokes an action** (pill,
  menu, shortcut, popup). No keystroke logging, no background uploads.
- Password/payment/OTP fields are excluded by `isSensitiveElement`
  (type, `autocomplete`, and label heuristics + unknown-type deny).
- Restricted pages (`chrome://`, web store, `about:`, `data:`) never match
  and the popup reports them gracefully.
- No `<all_urls>` token is used (Chrome treats `https/http */*` matches as
  host-permission equivalents without the internal-scheme reach).

## Data handling (matches the store disclosure)

- Sent to `*.tonecraft.site` on invocation only: selected/composed text
  (≤8000 chars), chosen tool/tone/options, session credential.
- Never collected: keystrokes, full page text, passwords, payment data,
  browsing history.
- Stored: preferences (sync), recent-tool metadata without text (local),
  session token in memory-only `chrome.storage.session` (cleared on browser
  close).
- Analytics: none transmitted. Errors: user-friendly strings only; raw
  text/tokens never enter logs or reports.
