# Dead Code Audit — 01

- **Scope:** ToneCraft src (App Router, React 19, TS, Tailwind)
- **Method:** Full src file inventory + import map (`@/` and relative `./` resolution) + symbol-name grep across all `src/**/*.{ts,tsx}`. No files modified.
- **Confidence groups**
  - **A — Unused files (zero importers, verified by name grep):** safe to delete.
  - **B — Dead exports in live files:** trim exports, keep files.
  - **C — Judgment calls (routes, links, CSS, boilerplate):** verify before deleting.

---

## Group A — Unused files (36)

### Components
| File | Notes |
|---|---|
| `src/components/chat/ChatInput.tsx` | Superseded by `PremiumComposer` + pickers |
| `src/components/chat/ChatList.tsx` | Same |
| `src/components/chat/ChatMessage.tsx` | Same; `PremiumMessageCard` is the live renderer |
| `src/components/workspace/PromptLibrary.tsx` | `PromptLibrary` export (line 102) unused; live twin is `PromptLibraryPage.tsx` |
| `src/components/workspace/ContextPanel.tsx` | Unused; live twin is `AIContextPanel.tsx` (used by `ComposeWorkspace`) |
| `src/components/layout/TopNavigation.tsx` | Unused; `AppShell` uses `shell/TopBar.tsx` instead |
| `src/components/shared/EmptyState.tsx` | Unused; `WorkspaceEmptyStates.tsx` is the live one |
| `src/components/shared/ErrorBoundary.tsx` | Class `ErrorBoundary` never imported (only `ErrorFallback` is used) |
| `src/components/shared/SuspenseBoundary.tsx` | `SuspensePage`/`SuspenseSection`/`SuspenseDefault` never imported |
| `src/components/ui/dialog.tsx` | Zero importers |
| `src/components/ui/separator.tsx` | Zero importers |
| `src/components/ui/sheet.tsx` | Zero importers |
| `src/components/ui/textarea.tsx` | Zero importers |
| `src/components/ui/toggle.tsx` | Zero importers |
| `src/components/ui/scroll-area.tsx` | Only imported by dead `ChatList.tsx` → dead transitively |
| `src/components/ui/recipes/PremiumPanel.tsx` | Only reachable via dead barrel re-export; `panelRecipe` consumer disappears |
| `src/components/ui/effects/index.ts` | Barrel not imported anywhere |

### Hooks
`src/hooks/use-click-ripple.ts`, `use-haptics.ts`, `use-motion-config.ts`, `use-preferences.ts`, `use-premium-toast.tsx`, `use-retry.ts`, `use-safe-async.ts`, `use-tools.ts` — zero importers (8 files).

### Services / Engine / Config / Styles
| File | Notes |
|---|---|
| `src/services/AnalyticsService.ts` | Zero importers |
| `src/engine/AIEngineError.ts` | Exports unused; `ProviderRouter` has its own private `isRetryable` |
| `src/engine/AIProviderError.ts` | Exports unused (only self-referenced) |
| `src/config/provider-clients.ts` | `getProviderClient`/`getProviderEnvVar`/`getProviderLabel` zero refs; real wiring is `ModelRegistry` + `ProviderRouter` |
| `src/styles/tokens.ts` | Aggregator with zero importers |
| `src/styles/elevation.ts`, `radius.ts`, `spacing.ts`, `typography.ts`, `z-index.ts` | Only reachable via dead `tokens.ts`; `colors.ts` and `motion.ts` are the live token files |
| `src/proxy.ts` | Orphaned; no `middleware.ts` exists, nothing references it (Next.js only picks up `middleware.ts`) |

## Group B — Dead exports in live files (51)

| File | Dead exports (line) |
|---|---|
| `src/lib/constants.ts` | `APP_NAME` (3), `APP_TAGLINE` (4), `APP_DESCRIPTION` (5), `FREE_TIER_LIMITS` (28), `PRO_TIER_LIMITS` (37), `FEATURES` (94), `AI_THINKING_STATES` (156) — only `NAV_LINKS`, `TONES`, `PRICING_TIERS`, `PLATFORMS` are used |
| `src/types/index.ts` | `Attachment` (53), `Usage` (81), `UsageRecord` (93), `ToolResult` (105) — the only `ToolResult` uses are in dead `use-tools.ts` |
| `src/lib/utils.ts` | `formatDate` (8), `formatFileSize` (17), `truncate` (25) — only `cn` is used (the `truncate` hits are the CSS class) |
| `src/styles/motion.ts` | `hover` (36), `tap` (44), `slideUp` (81), `slideDown` (87), `slideRight` (93), `slideLeft` (99), `scaleIn` (105), `blurIn` (111), `pageTransition` (124), `sidebarTransition` (129), `modalTransition` (134), `wordReveal` (177), `letterReveal` (191), `charReveal` (205), `card3D` (256), `sidebar` (165) |
| `src/styles/recipes.ts` | Fns: `cardRecipe` (60), `interactiveCard` (68), `toolbarRecipe` (76), `sidebarItemRecipe` (80). `recipe` subkeys `card`/`panel`/`toolbar`/`message`/`input`/`button`/`sidebar`/`divider`/`section` — only `recipe.badge` is used |
| `src/components/ui/effects/PremiumLoading.tsx` | `AIOrb` (7), `GradientLoader` (40), `MorphingDots` (52), `ThinkingGlyph` (72), `SidebarSkeleton` (104), `ContextLoading` (122), `PromptLoading` (133), `StreamingCursor` (148) — `AnimatedLogo` (158) + `SkeletonShimmer` (92) are live |
| `src/components/ui/effects/AnimatedGradient.tsx` | `AnimatedGradient` component export — only `BackgroundEffects` is used (by `shared/Effects.tsx`) |
| `src/components/workspace/AIThinking.tsx` | `StreamingCursor` (100), `ResponseIncoming` (110), `GenerationComplete` (129) — only `AIThinking` + `GradientPulse` used |
| `src/components/workspace/WorkspaceEmptyStates.tsx` | `WorkspaceEmptyState` (19), `NoChatsEmptyState` (54), `NoSearchResultsEmptyState` (77), `NoFavoritesEmptyState` (97), `NoBookmarksEmptyState` (107), `NoPinnedEmptyState` (150), `NoArchivedEmptyState` (160) — only `NoConversationEmptyState` (117) used |

## Group C — Judgment calls

- **Unreachable / dead links**
  - `src/components/landing/Footer.tsx` links `/docs` and `/api` — no such pages exist (404).
  - `/about` has a page but zero internal links (reachable only by typing the URL; listed in `proxy.ts` PUBLIC_PATHS).
  - `src/proxy.ts` PUBLIC_PATHS lists `/features` and `/pricing` — no pages exist (404).
  - Duplicate auth routes: `/login` + `/register` (linked by landing Navbar) and `/sign-in` + `/sign-up` (used by Clerk env config) — two parallel flows, one set redundant.
- **Unused CSS in `src/app/globals.css`** (45 classes with zero usages in src; caveat: not matched via dynamically-constructed class names): `animate-bloom`, `animate-blur-in`, `animate-fade-in`, `animate-fade-in-scale`, `animate-fade-in-up`, `animate-float`, `animate-glow-pulse`, `animate-gradient`, `animate-marquee`, `animate-pop`, `animate-pulse-soft`, `animate-scale-bounce`, `animate-scroll-indicator`, `animate-shimmer`, `animate-slide-in-right`, `animate-slide-up`, `animate-slide-up-fade`, `animate-spin-slow`, `animate-typing`, `animate-word-reveal`, `card-shine`, `demo-terminal`, `floating-card`, `focus-ring`, `glass-card`, `glass-deep`, `glass-frost`, `glass-panel-deeper`, `gpu`, `gradient-text-animated`, `hover-glow`, `hover-lift`, `hover-tilt`, `interactive-gradient`, `orbit-ring`, `particle-canvas`, `premium-card`, `primary-text`, `reveal`, `section-divider`, `shine`, `spotlight`, `stagger-children`, `stat-number`, `workspace-panel`.
- **Boilerplate assets** `public/{file,globe,next,vercel,window}.svg` — default create-next-app files, no refs in src.

## Duplicate helpers

- **`formatBytes` / `formatFileSize` — 4 copies of identical bytes→"X.XX MB" logic:**
  - `src/components/workspace/AIContextPanel.tsx:314` (used locally)
  - `src/components/workspace/KnowledgeLibraryPage.tsx:24` (used locally)
  - `src/components/workspace/PremiumMessageCard.tsx:454` (used locally)
  - `src/lib/utils.ts:17` `formatFileSize` — **unused**, safe to delete outright; if a shared helper is desired, promote one copy to `lib/utils.ts` and import it in the three components.
- **`EmptyState`** (`shared/EmptyState.tsx`, dead) vs **`WorkspaceEmptyState`** (`WorkspaceEmptyStates.tsx:19`, also dead) — same props shape; both removed, keep `NoConversationEmptyState`/`NoChatsEmptyState` variants.
- No other duplicates found (checked `getPersonaColor`, `getToneColor`, `wordCount`, `copyToClipboard`, `downloadFile`, `isValidUUID`, `slugify`, `clamp`, openAI client helpers).

## Notes / caveats
- Verify deletion impact: `chat-store.ts` stays (used by `chat/[chatId]/page` + `CommandPalette`) even though dead chat files also import it. `dropdown-menu.tsx` stays (used by `shell/TopBar`).
- Group A files are unambiguously removable; Group B exports are trim-only; Group C needs product decisions (e.g. keep `/about`, resolve which auth route set to keep, confirm CSS classes aren't used via string-built classes).
