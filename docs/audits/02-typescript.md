# TypeScript Audit

Date: 2026-08-02
Scope: read-only static audit of the ToneCraft codebase (`src/`), `strict: true` mode.
Method: manual source review plus targeted greps. Build status verified with `npx tsc --noEmit` (and `--incremental false`), which both PASS with **0 errors**.

Status summary:

- **Build: PASS** — `tsc --noEmit` exits 0, strict mode is on.
- **Critical: 0** — no compile errors; worst findings are runtime-crash risks on error paths, not build blockers.
- **Major: 4** — `catch (e: any).message` on thrown values that may not be `Error`; `any` hot paths with eslint-disabled; the `as unknown as any` bridge that defeats strict checking at the repository layer.
- **Minor: 7** — duplicated interface shapes forcing unsafe casts, dead duplicate type files, `any` where unions/Prisma types exist, dead duplicated components.
- **Enhancement: 5** — missing explicit return types, optional-chaining polish, a duplicated reduced-motion helper, unused TanStack query setup.

Counts: **38** explicit `any` type occurrences across 22 files (raw `\bany\b` including prose/comments = 92). **0** non-null assertions (`!`), verified by grep.

---

## Major

### M1. `catch (e: any)` then `e.message` — runtime TypeError if a non-Error is thrown
`src/hooks/use-tools.ts:30-31`, `src/app/api/messages/[messageId]/regenerate/route.ts:19-20`, `src/app/api/messages/[messageId]/continue/route.ts:19-20`.
In JS anything can be thrown (`throw "x"`, `throw { code }`). `(e as any).message` then returns `undefined` for a string and crashes the handler for `null`. These are error paths — the exact place a crash turns an already-failing call into a 500/blank screen.
Fix: `const msg = e instanceof Error ? e.message : String(e)`.

### M2. Repository layer bridges every Prisma result with `as unknown as`, defeating strict mode
`src/repositories/UsageRepository.ts:6` (`as unknown as any`), `ChatRepository.ts:28,40,52` and `MessageRepository.ts:12,19,40` (`as unknown as Chat[]/Message[]`), `PersonaService.ts:28,48`, `ProjectService.ts:20`.
The hand-written `Chat`/`Message`/`Persona` interfaces in `src/types/index.ts:16,34,63` are re-declarations of Prisma models that don't line up with the actual `select` shapes (e.g. repo returns `{ ...chat, _count }`, no `updatedAt`), so the `as unknown as` two-hop cast is required. Every consumer downstream of these files is untyped-by-lie: a field added to the Prisma schema but not to `types/index.ts` compiles fine and is silently `undefined` at runtime.
Fix: `satisfies` Prisma types, or derive the public types from `Prisma.ChatGetPayload<typeof chatSelect>` instead of hand-writing them. The `_count` mismatch is the exact symptom: `types/index.ts` Chat has no `messageCount` but `chatSelect` + `_count` produces it.

### M3. `chat: any` prop on the hot-path conversation row
`src/components/workspace/ConversationSidebar.tsx:275-276` — `ChatRow` takes `chat: any` (the grep hit sits next to an `eslint-disable`), even though `Chat` exists at `src/types/index.ts:16`. Every field typo, rename, or null-guard miss on a chat inside the sidebar is silent.
Fix: type it `chat: Chat` (and drop the eslint-disable once the cast in the caller is typed). Same pattern at `AIContextPanel.tsx:135,171` — `SummarySection`/`StatsSection` props are `: any` where `Chat` and `Message[]` exist.

### M4. `PersonasLibraryPage` casts a form shape to a model shape through `unknown`
`src/components/workspace/PersonasLibraryPage.tsx:285` — `setEditing(v as unknown as PersonaLibraryItem)` converts `PersonaFormData` (:25) into `PersonaLibraryItem` (:13) via `unknown`. The two shapes disagree: `PersonaLibraryItem` requires `id`, `isDefault`, `isFavorite`, `projectId`, `createdAt` which `PersonaFormData` doesn't carry. The edit state therefore *claims* to have fields it provably lacks; any component reading `editing.isFavorite` etc. gets `undefined`. This is a silent data-loss vector.
Fix: `PersonaLibraryItem = PersonaFormData & { id, isDefault, isFavorite, projectId, createdAt }` and keep the two in one place (see M5).

---

## Minor

### M5. Duplicated interface shapes (the 38 `any`s largely trace back to these)
- **AI error types duplicated, and both files dead**: `AIErrorCode` + an `AIEngineError` class are defined in BOTH `src/engine/AIEngineError.ts` and `src/engine/AIProviderError.ts` (also `AIErrorContext` vs `AIErrorMeta`). Neither file is imported anywhere in `src/`. Two sources of truth for error taxonomy that nothing uses.
- **`Chat`** `src/types/index.ts:16` vs Prisma `Chat` — bridged via `as unknown as` in `ChatRepository.ts` (M2).
- **`Message`** `src/types/index.ts:34` vs Prisma `Message` — bridged in `MessageRepository.ts` (M2).
- **`Persona`** `src/types/index.ts:63` vs `PersonaRecord` `src/services/PersonaService.ts:4` vs `PersonaFormData`/`PersonaLibraryItem` `PersonasLibraryPage.tsx:13,25` — three shapes, two of them invented in the page, one cast through `unknown` (M4).
- **`ProjectSummary`** `src/services/ProjectService.ts:4` duplicates the `ProjectRepository` select + `_count` shape.
- **`PromptItem`** `src/stores/prompts-store.ts:11` duplicates the `PromptRepository.promptSelect` shape.
- **`Usage`** `src/types/index.ts:81` exists but `UsageRepository.ts:6` returns `as unknown as any` instead of it.

### M6. `any` where a union or existing type already exists
- `src/services/ToolService.ts:23-32` and `src/app/api/chats/[chatId]/messages/route.ts:130-138` cast `tone`/`platform`/`length`/`formality` `as any` to satisfy `MessageUpdateInput`/`IntentConfig` string-union fields. Casting away the check a union is supposed to provide: a typo'd enum value ships to the DB.
- `src/services/MessageService.ts:15,31,47,49,79,88` — `context?: Record<string, any>` and 5 `as any` casts for the same tone/platform fields.
- `src/hooks/use-preferences.ts:33` — `value: any` should be `UserPreferences[keyof UserPreferences]` (the `UserPreferences` type at `types/index.ts:120` already exists; the rollback at :43 relies on it).
- `src/repositories/UserRepository.ts:24` — `const data: any = {}` should be `Prisma.UserUpdateInput`.

### M7. Dynamic icon lookups: `(Icons as any)[name]`
`src/components/workspace/ToolPicker.tsx:53` and `src/components/tools/ToolCard.tsx:14`. A typo'd `icon` string silently falls back to `Icons.Wand` at runtime. An explicit `Record<string, LucideIcon>` map (built from the ~6 icons actually used) removes the `any` and the fallback lie.
Fix: import the icons and build a typed map; `ToolCard.tsx:14` already has the fallback — make the map literal so the key type is checked.

### M8. Dead duplicated components carry their own duplicated types
`src/components/chat/` (`ChatInput.tsx` 186 lines, `ChatList.tsx` 96, `ChatMessage.tsx` 353) and `src/components/workspace/ContextPanel.tsx` (189) are not imported anywhere — legacy duplicates of `PremiumComposer`, `ConversationSidebar`, `PremiumMessageCard`, `AIContextPanel`. 824 lines of duplicate rendering logic and their bespoke prop shapes.
Also confirmed dead: `src/hooks/use-safe-async.ts`, `src/hooks/use-retry.ts`, `src/components/shared/SuspenseBoundary.tsx`, `src/components/shared/ErrorBoundary.tsx` — zero imports (the phase-5.5 loading/error system was superseded by route `loading.tsx`/`error.tsx`, which use `PageSkeleton`).

### M9. TanStack Query is wired but unused
`src/components/providers/QueryProvider.tsx` and an inline `QueryClientProvider` in `src/app/(dashboard)/layout.tsx` create query clients; no `useQuery`/`useMutation` with generics exists anywhere. The data layer is hand-rolled `fetch` hooks with `as T` casts on `res.json()` (`use-projects.ts:35`, `use-prompts.ts:35`). Two QueryClients is a code smell and the casts are the unchecked promise-to-type bridge.
Fix: delete the provider pair (keep one if/when the hooks are migrated), or type the fetch hooks against the `SearchResult`/`ProjectSummary`/`PromptItem` types that already exist.

### M10. `motion` `any` and duplicated reduced-motion helper
`src/styles/motion.ts:331-332` — `ai: Record<string, { initial?: any; animate: any; transition: Transition }>`; the variants dict accepts anything, so invalid variant names in the two callers (`ComposeWorkspace`, `ChatBubble`) only fail at runtime.
`src/hooks/use-reduced-motion.tsx:39` — `useSafeTransition(transition: any)` is never imported (M8-adjacent dead code); `ComposeWorkspace.tsx:34-36` defines a local `t` helper doing the same job. Delete the hook, keep the local.

---

## Enhancement

### E1. Missing explicit return types on the repository/service layer
`ChatRepository.findByUserId/findById/create/update`, `MessageRepository` methods, `PersonaService.list/create`, `ProjectService.getProject`, `UsageService.getUsage` all rely on inference, and the inference is *wrong* where `as unknown as` is involved (M2). Declaring `Promise<Chat[]>` etc. would surface the mismatch at the function signature instead of at every call site.

### E2. Error paths: prefer `instanceof Error` over `console.error(e)`
`src/lib/auth.ts:15-18,27-28,53-54` already does this correctly (`e instanceof Error ? e.message : e`). The same pattern belongs in `use-tools.ts`, the two message routes (M1), and `src/engine/AIEngineError.ts:112` (`(error as any)?.status`).

### E3. Untyped `res.json()` bridges
`src/app/(dashboard)/chat/[chatId]/page.tsx:36-47,81-84,94-97`, `src/components/workspace/PersonaPicker.tsx:42-48`, `src/hooks/use-chat.ts:45` — `fetch(...).json()` returns `any`; results flow straight into zustand stores typed as `Chat`/`Persona[]` with no check. A changed API shape silently becomes an empty store. `res.ok` + a `const data: Chat = await res.json()` narrowing is the minimal guard.

### E4. Optional-chaining spots
`src/components/workspace/PremiumMessageCard.tsx:237` uses `(children as any)?.props?.children` — the `as any` is only there to satisfy `?.` on a typed node; a typed guard (`isValidElement`/a `codeProps` type) removes it (see M7's record-map fix for the pattern). `use-search.ts:9` initializes with `{ chats: [], messages: [] }` even though `SearchResult` (`types/index.ts:112`) declares 5 arrays — the missing three are optional-by-omission, not by design; initialize all five.

### E5. `ProviderRouter` SDK-shape casts
`src/engine/ProviderRouter.ts:58,105` — `messages: options.messages as any` before calling the AI SDK. The `ConversationMessage` type the router accepts and the SDK's `Message` shape are structurally near-identical; a targeted `Pick`/mapping removes the cast instead of disabling the check at the AI boundary.

---

## Summary

Build is green (`tsc` 0 errors) and strict mode is genuinely on — the risk is not what the compiler catches but what `any` and `as unknown as` let it skip. Every Major finding is the same failure mode: an `any` (or a `as unknown as X` bridge) sitting on a trust boundary (thrown errors, Prisma results, AI-SDK input), where a wrong assumption becomes a silent `undefined` or a runtime crash. Fixing M5 (derive types from Prisma instead of hand-writing) would collapse M2, M3, M4 and most of M6 in one pass; M1 is a four-line change with immediate crash-elimination payoff.
