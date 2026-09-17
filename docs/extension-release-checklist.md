# Extension release checklist

Copy for each release. Version under test: ______ (must equal
`extension/manifest.base.json` → generated manifests → zip names).

## Build

- [ ] `npm run extension:typecheck` clean
- [ ] `npx jest extension` green (currently 37 tests)
- [ ] `npx playwright test e2e/extension.spec.ts --project=chromium` green (8 tests)
- [ ] `npm run extension:release` succeeds (build + validate + package)
- [ ] `manifest.json` in each `dist/extension-*` reviewed (permissions, matches, version)
- [ ] No secrets: `validate.mjs` passed (plus manual `grep -ri "sk-\|api[_-]key" dist/`)
- [ ] No dev URLs in output (`localhost` rejected by validator)
- [ ] Zip roots verified: `manifest.json` at archive root (no outer folder)

## Security

- [ ] Permissions diffed against `docs/extension-permissions.md` (no additions)
- [ ] Signed-out flow tested (401 → Sign in CTA, no crash)
- [ ] Unauthorized API probe: tampered `toolId` rejected by server (400/422, friendly message)
- [ ] Oversized input (9000 chars) rejected client-side before network
- [ ] Generated `<script>`/HTML payload inserted as inert text (no `innerHTML` anywhere — `grep -rn innerHTML extension/src` empty)
- [ ] Password field on fixture: no pill, value untouched (automated)
- [ ] Prompt-injection sanity: selection containing "ignore previous instructions" generates normally without privilege change (server prompts are fixed server-side)

## UX (unpacked `dist/extension-chrome` in Chrome)

- [ ] Install: options/onboarding opens once, skippable, never repeats
- [ ] Popup: plan + usage correct vs website; quick action works; compose works
- [ ] Floating pill → panel → Rewrite → Replace / Insert / Copy / Retry
- [ ] Side panel (Alt+T): full workspace incl. tone/length/language/instructions
- [ ] Context menu: 6 tools + hub; hub fallback on restricted pages
- [ ] Cancel mid-generation aborts cleanly, no stale result
- [ ] Undo (Ctrl+Z) restores original in textarea AND contenteditable
- [ ] Light mode + dark mode readable; reduced-motion respected; Esc closes

## Real websites (manual — never claim untested)

- [ ] LinkedIn post composer + message box
- [ ] Gmail compose
- [ ] Slack message box
- [ ] X post composer
- [ ] Reddit comment box
- [ ] Discord message box
- [ ] Notion block
- [ ] GitHub comment box
- [ ] Generic textarea + generic contenteditable + React contenteditable
- [ ] Google Docs: confirm graceful behavior (best-effort only)
- [ ] Two tabs simultaneously: results never cross tabs

## Browsers / packages

- [ ] Chrome package installs from zip, worker starts error-free
- [ ] Edge runs the Edge package (or documented Chromium-build reuse)
- [ ] Firefox package manifest reviewed (`scripts` background, `sidebar_action`, gecko id)
- [ ] Safari: source prepared; Xcode conversion tracked as manual work
- [ ] Icons present 16/32/48/128 in every package

## Store

- [ ] Store copy reviewed (`extension/store/chrome-description.md`)
- [ ] Privacy disclosure matches `docs/extension-privacy.md` exactly
- [ ] Screenshots current (`extension/store/screenshots/`, real UI captures)
- [ ] Support URL + privacy URL final
- [ ] Permission justifications pasted from `docs/extension-permissions.md`
