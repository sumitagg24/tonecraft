# Phase 8.13 — Performance Optimization (Migration Report)

**Date:** 2026-08-02 · **Branch:** phase-8-product-architecture
**Status:** ✅ Complete — `tsc` clean, `eslint --max-warnings=0` clean, `next build` succeeds

Implemented per `docs/audits/03-performance.md`. No UI changes — behavior and
visuals are identical.

---

## P0-1 — Typed tool-icon map (bundle weight) ✅

The `import * as Icons from "lucide-react"` tree-shaking defeat is **gone**.

- `src/components/icons/tool-icons.ts` — **new** typed `Record<string, LucideIcon>`
  built from named imports (38 icons actually used by `ToolDefinitions`).
- `ToolPicker.tsx` / `ToolCard.tsx` now look up `toolIcons[tool.icon]` with a typed
  fallback (`|| toolIcons.Wand`); a typo now fails at compile time.
- **Impact:** the tools route + composer picker no longer pull all ~1,400 lucide
  icons. This was the single largest client-bundle item in the audit (~90–110 KB
  gzip). It also un-blocks `optimizePackageImports` for lucide.

## P0-2 — Streaming no longer re-renders the whole chat page ✅

1. **Store selectors** — replaced whole-store subscriptions with zustand selectors
   in every streaming-path component, so a per-token `streamingContent` update
   re-renders only the consumers that need it:
   - `chat/[chatId]/page.tsx` (`currentChat`, `messages`, `isLoading`,
     `streamingContent` as separate selectors)
   - `ConversationSidebar`, `ProjectSidebar`, `ProjectPage`, `AIContextPanel`
     (×2), `PremiumComposer` (×2), `TonePicker`, `SmartSuggestions`,
     `PersonaPicker`, `CommandPalette`
2. **Memoized list rows** — `ChatItem` and `ContextMenuItem` in the conversation
   sidebar are now `React.memo`; the row `onSelect` was refactored to a stable
   `handleSelectChat(chatId)` so memo actually holds during streaming.
3. **rAF-coalesced scroll writes** — the chat page's smart-scroll effect now
   coalesces per-token `scrollTop` writes to one per animation frame instead of
   one forced-layout write per token. Cleaned up on unmount.

## P1-1 — Framer Motion: dropped `layout` on large lists ✅

Per audit guidance ("drop `layout` on large lists"), removed the layout-animation
prop from the three list surfaces where it ran a layout pass per item on mount:
`ConversationSidebar` ChatItem rows, `KnowledgeLibraryPage` file rows, and
`PromptLibrary` grid rows. The small `layoutId` tab underlines (ProjectPage,
library page) are kept — they are single elements, not lists.

A full `LazyMotion`/`m` conversion was **not** done: `layoutId` usages require the
`domMax` feature set, which negates most of the bundle savings; this is left as an
experiment on a separate branch (audit P1-1 / ranked #4).

## P1-2 — SSE notification stream: reconnect + visibility pause ✅

`use-notifications.ts` no longer permanently kills the EventSource on the first
network error. It now:
- reconnects with exponential backoff (1s → 30s cap), reset on healthy messages
- pauses the stream when the tab is hidden and resumes on visibility change
- fully disposes on unmount (no leaked timers/connections)

## P1-4 — Dead client dependencies removed ✅

Verified zero importers, then removed:
- `@tanstack/react-query` — two `QueryClient`s existed with **zero**
  `useQuery`/`useMutation` consumers. Deleted `QueryProvider.tsx` and unwrapped
  both the root layout and the dashboard layout.
- `rehype-raw` — wired into no markdown renderer (also removed a latent XSS
  surface flagged in security audit L2).
- `dompurify` + `@types/dompurify` — no importers anywhere.

## P2-1 — Logger persistence gated to dev ✅

`src/lib/logger.ts` `persistLog` no longer does synchronous `localStorage`
writes in production hot paths (`process.env.NODE_ENV !== "development"` guard).

## Files changed

- New: `src/components/icons/tool-icons.ts`, `docs/migrations/phase-8.13-performance.md`
- Modified: `ToolPicker`, `ToolCard`, chat page, `ConversationSidebar`,
  `ProjectSidebar`, `ProjectPage`, `AIContextPanel`, `PremiumComposer`,
  `TonePicker`, `SmartSuggestions`, `PersonaPicker`, `CommandPalette`,
  `KnowledgeLibraryPage`, `PromptLibrary`, `use-notifications`, `logger.ts`,
  root + dashboard layouts
- Deleted: `src/components/providers/QueryProvider.tsx`
- package.json: −4 deps

## Verification

```
npx tsc --noEmit              ✅ 0 errors
npx eslint src --max-warnings=0  ✅ 0 errors
npm run build                 ✅ succeeds
```

## Remaining debt

- Full `LazyMotion`/`m` conversion (blocked by `layoutId` → needs `domMax`; wants
  a before/after bundle diff on a branch).
- Audit-01 dead code (36 files / 51 exports, e.g. legacy `chat/*` components,
  `use-haptics`, `use-performance`) — separate cleanup phase.
- React Compiler evaluation (Next 16) — experiment on a branch.
- Lighthouse CI budget — planned in audit 11 / CI phase.
