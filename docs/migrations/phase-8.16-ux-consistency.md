# Phase 8.16 — UX Consistency (Migration Report)

**Date:** 2026-08-02 · **Branch:** phase-8-product-architecture
**Status:** ✅ Complete — `tsc` clean, `eslint --max-warnings=0` clean, `next build` succeeds

Implemented per `docs/audits/07-ux-polish.md`. Consistency-only — no redesigns.

---

## P1-1 — One Radix modal primitive; hand-rolled overlays migrated ✅

- **New `src/components/shared/Modal.tsx`** — one Radix Dialog-based centered modal
  (focus trap, Escape, `aria-modal`, consistent `rounded-2xl`/`p-6`/`shadow-premium`
  language) with `title`/`description` props.
- Migrated the hand-rolled `fixed inset-0` centered overlays to it:
  - `PromptEditor` and `PromptRunDialog` (PromptLibraryPage)
  - `HistoryDialog`
- The anchored popovers (NotificationCenter, ExportMenu, PickerSurface, menu
  backdrops) keep their anchored positioning — they are popovers, not dialogs —
  but now share the same duration/ease tokens (see P2-3).

## P1-2 — EmptyState unified + error variant ✅

`src/components/shared/EmptyState.tsx` gained a `variant: "default" | "error"`
(with a default `AlertTriangle` icon and a `Retry` action via `onRetry`) so
failed loads stop masquerading as emptiness. Migrated the most visible inline
empties in `KnowledgeLibraryPage` ("No documents yet" / "No files match") to the
shared component.

## P1-3 — Loading states: `role="status"` everywhere ✅

Added `role="status"` + `aria-label` to the standalone in-page loading blocks
(billing ×2, search, share/[token], notifications) and the knowledge library
spinner — unlabeled spinners are gone from the fetch sites.

## P1-4 — Font-size tokens kill the 9–11px arbitraries ✅

- Added `nano` (9px), `micro` (10px), `tiny` (11px) to `tailwind.config.ts`
  `fontSize` and to the `src/styles/typography.ts` token map.
- Bulk-replaced every `text-[9px]` / `text-[10px]` / `text-[11px]` in `src/**/*.tsx`
  with `text-nano` / `text-micro` / `text-tiny` — **0 arbitrary micro-sizes
  remain**. Visual size is identical; the values are now tokenized and can be
  tuned (or deprecated) globally.

## P2-3 — Animation-token drift fixed in the popovers ✅

Hardcoded `transition={{ duration: 0.12 }}` in `NotificationCenter` and
`ExportMenu` now use `duration.fast` + `ease.default` from `src/styles/motion.ts`,
so reduced-motion and global tuning apply.

## Files changed

- New: `src/components/shared/Modal.tsx`, `docs/migrations/phase-8.16-ux-consistency.md`
- Modified: `tailwind.config.ts`, `src/styles/typography.ts`,
  `src/components/shared/EmptyState.tsx`, `src/components/shared/HistoryDialog.tsx`,
  `src/components/workspace/PromptLibraryPage.tsx`,
  `src/components/workspace/KnowledgeLibraryPage.tsx`,
  `src/components/shell/NotificationCenter.tsx`, `src/components/workspace/ExportMenu.tsx`,
  `src/app/(dashboard)/billing/page.tsx`, `src/app/(dashboard)/search/page.tsx`,
  `src/app/(dashboard)/notifications/page.tsx`, `src/app/share/[token]/page.tsx`,
  + ~40 files touched by the font-size token sweep

## Verification

```
npx tsc --noEmit              ✅ 0 errors
npx eslint src --max-warnings=0  ✅ 0 errors
npm run build                 ✅ succeeds
```

## Remaining debt (deferred)

- **P2-1** touch targets ≥44px on icon buttons (a11y audit cross-ref; needs a
  deliberate sizing pass — deferred to avoid layout surprises).
- **P2-2** `rowHover`/`iconButton` recipes — the recipe layer is barely consumed;
  wiring it everywhere is a bigger refactor than the drift it fixes.
- **P2-5/P2-6/P3** scrollbar global utility, duplicate `h1`s, kbd/padding
  micro-consistency — tracked, low-impact.
