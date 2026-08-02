# Performance Audit — 03

Date: 2026-08-02 · Scope: client bundles, render behavior, animation, data fetching, and build weight across `src/`. Read-only audit; nothing modified.
Method: source review + targeted greps (memo/useMemo/useCallback, next/dynamic, lucide imports, framer-motion, SSE/EventSource, localStorage, fetch). No runtime profiling run (no live server) — bundle-size claims are estimates and must be confirmed with `next build`/bundle analyzer.

Status summary (ranked by estimated impact):

- **P0: 2** — a tree-shaking defeat that inflates every client bundle; streaming re-renders that jank on low-end devices.
- **P1: 5** — Framer Motion bundle, SSE lifecycle, duplicate chat fetches, per-token scroll writes, dead dependency weight.
- **P2: 6** — logger localStorage writes, list `layout` animations, `ssr:false` landing sections, image handling, motion-token drift, performance budgets.

---

## P0

### P0-1. `import * as Icons from "lucide-react"` defeats tree-shaking (bundle weight)

`src/components/workspace/ToolPicker.tsx:3` and `src/components/tools/ToolCard.tsx:2` import the **entire lucide-react namespace** and look icons up dynamically:

```tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Icon = (Icons as any)[tool.icon] || Icons.Wand;
```

Dynamic string access means the bundler cannot know which icons are used and must include **all ~1,400 icons** (~800–900 KB unminified, on the order of 90–110 KB gzip). Both files also import individual named icons (`Search`, `Loader2`, etc.) — so the namespace import is *only* there for the dynamic lookup. `optimizePackageImports` (Next default for lucide) cannot help because the entire module is requested.

- Why it exists: `ToolDefinitions.ts` stores `icon: string` names, so the renderer needs a name→component map.
- Fix (small): the set of icon names in `ToolDefinitions` is closed (~12). Build a typed `Record<string, LucideIcon>` from named imports in one shared file (`src/components/icons/tool-icons.ts`), delete the `* as Icons` imports, and type the map so a typo fails at compile time (also kills TS-audit M7).
- Impact: tens of KB gzip removed from the tools route and the composer picker — the biggest single bundle win in the app.

### P0-2. Streaming re-renders the whole chat page and sidebar on every token

- `src/app/(dashboard)/chat/[chatId]/page.tsx:15` — `const { currentChat, messages, isLoading, streamingContent } = useChatStore();` subscribes to the **entire store**. During streaming, `appendStreamingContent` (chat-store) fires on every token, so the page re-renders on every token.
- The page's smart-scroll `useEffect` (`:70-83`) runs on every token too and executes `el.scrollTop = el.scrollHeight` — a forced layout read/write per token. With fast streams (Groq) this is dozens of writes/sec.
- `ConversationSidebar.tsx` and `ProjectSidebar.tsx` also subscribe to whole stores; token updates re-render every conversation row. Only `PremiumMessageCard` uses `React.memo` (grep: exactly **1** memo in the app, `PremiumMessageCard.tsx:30`). `ChatRow`, sidebar groups, and NotificationCenter rows are unmemoized.
- `PremiumMessageCard` is memoized, so its *siblings* skip re-render — but the page body itself (header, ExportMenu, scroll effect, composer) does not.

Fixes, cheapest first:
1. Use zustand selectors: `useChatStore((s) => s.streamingContent)` etc., so unrelated store slices don't re-render consumers.
2. `memo` the conversation row components (`ChatRow`, `ContextMenuItem`, picker rows).
3. In the scroll effect, write `scrollTop` only when the user is `atBottom`, and coalesce per-token writes with `requestAnimationFrame` (a token can arrive during a frame; one write per frame is enough).
4. Consider streaming into the message card's local state instead of the global store (the streaming card is the only consumer that needs per-token updates).

---

## P1

### P1-1. Framer Motion: full library, 25+ files, 250+ usages

`import { motion, AnimatePresence } from "framer-motion"` appears across ~25 files (CommandPalette, ChatInput/ChatMessage/ChatList, Navbar, Hero, all landing sections, ComposeWorkspace, ConversationSidebar, pickers, ExportMenu, ToolPanel, PromptLibraryPage, AIThinking, KnowledgeLibraryPage, NotificationCenter, shared/…). The full runtime is ~40–60 KB gzip.

- Most usages are simple `initial/animate/exit` + `whileHover`/`whileTap` — a mix of `m`-compatible primitives.
- **~40 `whileHover`/`whileTap`** buttons create per-element gesture listeners (fine individually; combined with list animations it adds up on low-end mobile).
- `KnowledgeLibraryPage.tsx:159` uses `motion.div layout` on every file row — a layout-animation pass on each item on mount (and on reorder).
- Chat page uses `AnimatePresence mode="popLayout"` around all messages.

Fixes:
- Adopt `LazyMotion` + `m` (or `MotionConfig` with `reducedMotion`) to cut roughly half the motion bundle; convert the ~40 simple hover/tap buttons to CSS `transition` + `active:`/`group-hover:` utilities (Framer isn't needed for scale-on-hover).
- Drop `layout` on large lists, or scope it to the item being added.
- Verify `useReducedMotion`/`ReducedMotionProvider` gates the streaming wave, cursor, and BackToTop (a11y audit E3 asks the same).

### P1-2. SSE notification stream: one connection per component, no reconnect

`src/hooks/use-notifications.ts:80-103` opens `new EventSource("/api/notifications/stream")` on **every mount**. `NotificationCenter` (mounted in `TopBar` on every dashboard page) opens one; the notifications page opens another.

- `es.onerror = () => { es.close(); }` — after the first transient network error the stream is **permanently dead** for the session (EventSource would otherwise auto-reconnect).
- No reconnection on `visibilitychange`; no heartbeat handling on the client; the server stream route (`src/app/api/notifications/stream/route.ts`) must send keep-alive comments or proxies will close idle connections.

Fixes: lift a single EventSource to app scope (one connection), reconnect with backoff on error, pause when `document.hidden`, and confirm the route sends keep-alives.

### P1-3. Double data fetch on every chat open

`chat/[chatId]/page.tsx:29-47` fires `fetchChats()` (full chat list) **and** `GET /api/chats/{chatId}` (full chat incl. messages) on mount — two DB round trips per screen. The per-chat GET also repeats after every regenerate/continue (`:79-105`).

Fixes: keep chat messages in the store across navigations (today `setCurrentChat` resets `messages` on every navigation), or dedupe with a small cache keyed by `chatId`; after regenerate/continue, update from the SSE/route response instead of a full refetch.

### P1-4. Dead weight in the client bundle: unused dependencies & dead code

Confirmed unused (grep-verified, cross-ref audit 01):
- `rehype-raw` — installed, wired into **no** markdown renderer (also a latent XSS switch, security L2).
- `@tanstack/react-query` — two `QueryClient`s created (root `QueryProvider` + inline in `(dashboard)/layout.tsx`), **zero** `useQuery`/`useMutation` consumers.
- `dompurify` + `@types/dompurify` — no importers found (verify before removing).
- Audit-01 Group A (36 unused files) + Group B (51 dead exports) — e.g. 824 lines of dead `chat/*` components, dead hooks, unused styles.

Fixes: `npm rm rehype-raw dompurify @types/dompurify` (verify), drop the QueryClient pair, execute audit-01 deletions. This shrinks every route's JS.

### P1-5. No memoization strategy & hand-rolled perf hooks

- Exactly **1** `React.memo` in 89 components; ~180 `useCallback`/`useMemo` calls are hand-rolled but there's no `memo` on list children where it matters (P0-2).
- Next 16 ships the React Compiler; enabling it (`experimental.reactCompiler`/babel-plugin) would auto-memoize and could replace a large fraction of the hand-rolled `useCallback` ceremony. Evaluate on a branch with a before/after bundle diff.
- Dead perf helpers: `use-performance.ts` (Performance API marks — imported nowhere), `use-safe-async.ts`/`use-retry.ts` (dead, audit 01).

---

## P2

### P2-1. Client logger does synchronous localStorage writes on every log

`src/lib/logger.ts` `persistLog` runs `localStorage.getItem` + `JSON.parse` + `push` + `setItem` synchronously on every `info`/`warn`/`error` (debug is dev-gated). Cheap per call, but if ever called in a hot path (stream loop, polling) it blocks the main thread, and the 500-entry ring buffer is useless telemetry in production anyway (see audit 12). Gate persistence to `process.env.NODE_ENV === "development"`, or ship logs to a backend (`navigator.sendBeacon`) instead.

### P2-2. Landing: 10 sections all `ssr:false`

`DynamicLandingSections.tsx` lazy-loads InteractiveDemo, WhyToneCraftComparison, Capabilities, AIWorkflowSection, Testimonials, Pricing, FAQ, CTA, Footer, BackToTop — all `{ ssr: false }`. The Hero stays SSR'd (good). Consequences: the above-fold marketing content is JS-rendered (no SSR HTML for SEO), and sections pop in after hydration (CLS/scroll jumps on slow devices).

Fixes: mark the text/static sections `ssr: true` with `loading` skeletons (they're cheap to server-render), keep `ssr:false` only for `InteractiveDemo` (browser APIs). This is an SEO + CLS + first-render win with no interaction cost.

### P2-3. Image handling

No `<Image>`/`next/image` usage found in landing or workspace (visuals are CSS/SVG — good for perf). The `images.remotePatterns` config exists (Google/Cl/GitHub avatars, R2), so confirm the Avatar in `TopBar` uses `next/image`; if any avatar uses a plain `<img>`, switch it to get caching/resizing. R2-hosted attachment previews should also go through `next/image` (with the `*.r2.dev` pattern already configured) — verify they don't load full-resolution bytes.

### P2-4. Motion/animation token drift

Some components use the `duration.*`/`spring.*` tokens from `src/styles/motion.ts` (chat page uses `duration.normal`, `spring.snappy`); others hardcode literals (`NotificationCenter` `duration: 0.12`, ExportMenu `0.15`). Consistency is a polish issue (audit 07 P2-3) but also means animation tuning touches many files. Use the token layer everywhere.

### P2-5. No performance budget or automated checks

No Lighthouse CI, no `next build` budget assertions, no `reportWebVitals` handler. With the streaming UI and animation load, Web Vitals can regress silently. Add a Lighthouse CI budget (LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms on the landing route) as part of CI (see audit 11).

### P2-6. `next/font` is done right — keep

`Inter` + `JetBrains_Mono` via `next/font/google` (self-hosted, no layout shift) — good. No changes.

---

## Ranked optimization list

| # | Item | Est. impact | Effort | Where |
|---|---|---|---|---|
| 1 | Typed tool-icon map; drop `* as Icons` | Very high (bundle) | Small | ToolPicker, ToolCard, ToolDefinitions |
| 2 | Store selectors + `memo` list rows; rAF scroll writes | High (streaming jank) | Medium | chat page, chat-store, ConversationSidebar |
| 3 | Remove dead deps + audit-01 dead code | High (bundle) | Medium | package.json, per audit 01 |
| 4 | LazyMotion/`m` + CSS hover/tap conversion | High (bundle, mobile) | Medium | ~25 files |
| 5 | Single shared SSE with reconnect | Medium (reliability, battery) | Small | use-notifications, stream route |
| 6 | Cache chat data across navigation | Medium (network) | Small | chat page, chat-store |
| 7 | `ssr:true` for static landing sections | Medium (SEO/CLS) | Small | DynamicLandingSections |
| 8 | Token-aware history truncation | Medium (context cost) | Small | ContextBuilder (see audit 10-A5) |
| 9 | React Compiler evaluation | Medium (main thread) | Experiment | next.config |
| 10 | Logger persistence gating | Low | Tiny | logger.ts |
| 11 | Lighthouse CI budget | Low (guardrail) | Small | CI (audit 11) |

## Notes / caveats

- Bundle-size figures are estimates; run `npx next build` with `@next/bundle-analyzer` (or `next build --experimental-build-mode compile`) before/after the top 4 items to confirm.
- The `import * as Icons` pattern also breaks `optimizePackageImports`, so P0-1 must be fixed before measuring lucide's contribution.
- Streaming UX can't be fully judged statically — after the P0-2 selector/memo fix, verify token cadence on a throttled device profile in DevTools (CPU 4× slowdown).
