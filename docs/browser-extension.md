# ToneCraft Browser Extension

> AI writing assistance everywhere you type — the ToneCraft web product,
> inside every text field on the web.

## Architecture

```
webpage (untrusted)            extension (privileged)              server (trusted)
─────────────────              ──────────────────────              ─────────────────
content script ──validated──▶ service worker ──auth'd API──▶ ToneCraft backend
  │  selection,                  │  generation, session,            │  /api/tools
  │  floating UI (Shadow DOM),   │  menus, commands, cancel         │  /api/ai/assist
  │  insertion (undo-safe)       │                                  │  /api/usage, /api/subscription
  ▼                                                              (auth + plan + limits enforced)
popup / side panel / options (extension pages, real functionality)
```

- **Content script = untrusted context.** It renders UI and edits the DOM,
  but every message it sends is allowlist-validated by the worker
  (`extension/src/shared/validate.ts`). AI output is inserted as **plain
  text only** (never `innerHTML`).
- **Service worker = privileged context.** Owns network, cookies, storage,
  cancellation (per-`requestId`, so tabs never interfere).
- **Server = policy.** The extension reuses the website's existing routes —
  no new backend was added. Auth (Clerk), plan/usage caps, zod validation
  and rate limits apply exactly as on the web.

### Directory layout

```
extension/
  manifest.base.json        # single source: version + store metadata
  src/
    shared/                 # types, tool registry, errors, strings, browserApi, storage, validate
    background/             # serviceWorker, apiClient, session, generation, contextMenus, commands, messages
    content/                # contentScript, selection, editors, insertion, floatingUi, observer, adapters/
    popup/ | sidepanel/ | options/   # UI pages (vanilla TS + CSS, design-token matched)
    ui/                     # shared page helpers
  scripts/                  # build.mjs, package.mjs, validate.mjs, gen-icons.js
  __tests__/                # jest unit tests (incl. registry↔site parity)
  icons/                    # 16/32/48/128 (generated, committed)
```

### Reused ToneCraft capabilities (no duplication)

| Extension action | Backend | Server source of truth |
|---|---|---|
| Rewrite | `POST /api/ai/assist` (`rewrite`) | `src/app/api/ai/assist/route.ts` |
| Improve | `POST /api/tools` (`enhance`) | `src/app/api/tools/route.ts` |
| Shorten | `POST /api/tools` (`enhance` + `length: short`) | same |
| Expand / Summarize / Grammar(tone/continue) | assist actions | same |
| 8 tone rewrites | `POST /api/tools` (`*-rewrite` toolIds) | `src/components/tools/ToolDefinitions.ts` |
| Translate / Simplify / compose templates | `POST /api/tools` | same |
| Plan + usage display | `GET /api/subscription`, `GET /api/usage` | existing routes |

The registry (`src/shared/constants.ts`) is pinned to real backend
capabilities, and `__tests__/tools-registry.test.ts` fails CI if the site
renames a tool without updating the extension. Web-only capabilities
(chats, workspaces, knowledge base, automations, voice/vision, persona
marketplace) intentionally remain web-app-only.

## Authentication

Same Clerk account as the website — no second user database, no new
secrets, no long-lived tokens in source:

1. The worker reads the site's `__session` cookie (`cookies` permission +
   `host_permissions` for `*.tonecraft.site`) and sends it as
   `Authorization: Bearer` (same mechanism as the realtime socket
   handshake in `src/app/api/socket/route.ts`).
2. Falls back to `credentials: "include"` fetches.
3. On 401 the cached token is dropped and every surface shows
   **Sign in to ToneCraft** (opens `/sign-in`); logout clears extension
   state and links to site account settings.

Session JWTs are short-lived by Clerk design: the worker re-reads the live
cookie on every call and surfaces re-sign-in cleanly on expiry.

## Local development

```bash
npm install                  # installs esbuild + @types/chrome (devDeps)
npm run extension:dev        # readable builds with sourcemaps → dist/
npm run extension:build:chrome
# chrome://extensions → Developer mode → Load unpacked → dist/extension-chrome
npm run extension:typecheck  # tsc over extension/
npx jest extension           # unit tests
npx playwright test e2e/extension.spec.ts --project=chromium  # browser E2E
```

Point the extension at local dev via the options page site-URL override
(any `http(s)` origin; production builds never ship dev URLs — the
validator rejects them).

## Building / packaging / releasing

```bash
npm run extension:build      # all targets → dist/extension-{chrome,firefox,edge,safari}
npm run extension:validate   # manifest + refs + permissions + secret scan
npm run extension:package    # → release/<target>/tonecraft-extension-<target>-vX.Y.Z.zip
npm run extension:release    # build + validate + package
```

Version lives ONLY in `extension/manifest.base.json` (`version`); manifests
and zip names are generated from it. See `docs/extension-release-checklist.md`
and `docs/chrome-web-store-deployment.md`.

## Browser compatibility

| Browser | Package | Notes |
|---|---|---|
| Chrome | `dist/extension-chrome` | Primary. MV3 service worker, side panel (≥114). E2E-verified. |
| Edge | `dist/extension-edge` | Same Chromium build shape as Chrome; Edge runs it directly. |
| Firefox | `dist/extension-firefox` | `background.scripts` + `sidebar_action` + gecko settings. Static validation only (see Known limitations). |
| Opera / Chromium | Chrome build | Documented compatible; no separate package. |
| Safari | `dist/extension-safari` | Source-compatible manifest prepared; **requires Xcode conversion on macOS** (manual step, documented). |

Google Docs is explicitly best-effort (canvas-based editor surface; the
extension fails gracefully there). iframe editors are out of scope
(`all_frames: false`, documented).

## Testing

- `npx jest extension` — 37 unit tests: protocol validation, registry↔site
  parity, error mapping, storage/adapters, generation mapping + errors +
  cancellation (mocked fetch).
- `npx playwright test e2e/extension.spec.ts` — 8 browser tests on local
  fixtures: worker boot, popup states, content-script isolation, textarea +
  framework-editor replace flows, **native undo**, password-field exclusion,
  multi-tab isolation, options/sidepanel load. Backend stubbed at the
  network layer; real-site testing remains a manual checklist item
  (`docs/extension-release-checklist.md`).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Panel says “Sign in” although signed in on site | Different browser profile, or expired session cookie — sign in on `tonecraft.site` in the same profile, then Retry. |
| Pill never appears | Floating button disabled in options; or a password/payment field (by design); or a restricted page (`chrome://`, store). |
| Replace did nothing, text was copied | Editor re-mounted mid-generation — paste with Ctrl+V (message says so). |
| 429 / limit message | Plan cap enforced server-side — same counters as the website; upgrade on `/pricing`. |
| Side panel won't open (Alt+T) | Browser without sidePanel API (Firefox uses sidebar) or shortcut conflict — remap at `chrome://extensions/shortcuts`. |
