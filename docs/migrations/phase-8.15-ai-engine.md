# Phase 8.15 — AI Engine Cleanup (Migration Report)

**Date:** 2026-08-02 · **Branch:** phase-8-product-architecture
**Status:** ✅ Complete — `tsc` clean, `eslint --max-warnings=0` clean, `next build` succeeds

Implemented per `docs/audits/10-ai-architecture.md`. No UI changes.

---

## A1 — Single source of truth; legacy PROVIDERS removed ✅

`src/engine/ProviderRouter.ts` no longer contains the hardcoded `PROVIDERS`
array (which referenced **retired model IDs**: `llama-3.1-70b-versatile`,
`gemini-1.5-flash`/`pro`, `claude-3.5-sonnet`) nor the `isPro` backward-compat
branch. Routing now resolves **only** through `config/models.ts` +
`ModelRegistry` (current IDs: `llama-3.3-70b-versatile`, `gemini-2.5-*`,
`claude-3.7-sonnet`). The no-plan path defaults to `PlanTier.FREE` config
instead of the legacy free list — same effective set, correct IDs.

- Deleted: `src/config/provider-clients.ts` (a third, dead copy of provider
  client wiring flagged in audit 01).

## A2 — Removed the lying `anthropic` provider type ✅

`ProviderName` no longer includes `"anthropic"` — no client exists for it and no
model uses it (Claude routes via openrouter). Re-adding now requires a real
`@ai-sdk/anthropic` client; the type can no longer silently promise one.

## A3 — Idle timeout replaces the 60s wall-clock kill; client disconnect chains ✅

`ProviderRouter` now uses a `createIdleAbort` controller:
- **Idle timeout** (60s, reset on every token) — a slow-but-progressing stream
  is no longer aborted by a wall-clock cap.
- **External signal chaining** — the HTTP request's `req.signal` is threaded
  through `EngineOptions.signal` → `RouteOptions.signal` → the provider call, so
  a client disconnect cancels the upstream provider request (no more spending
  provider tokens after the client left).
- Cleanup guarantees: timers cleared and external listeners removed in a
  `finally`, in both `route()` and `stream()`.

## A7 — Tool-calling protocol + registry (prep) ✅

- **New `src/engine/tools.ts`** — typed `AITool` protocol (`name`, `description`,
  `inputSchema` as JSON Schema, `handler`) and a `ToolRegistry` singleton with
  `register`/`unregister`/`get`/`list`/`usableFor(capabilities)`.
- `RouteOptions`/`EngineOptions` accept `tools?: AITool[]`; `ProviderRouter`
  maps them to the AI SDK `ToolSet` (`toSDKTools`) and passes them to
  `streamText` when present. Nothing registers tools yet — `ToolService` remains
  prompt-based — but the contract is ready for MCP/agents and gates on the
  model's `capabilities.tools` flag.

## A12 — Failover queue now catches 5xx/network too ✅

`isRetryable()` extended beyond 429/timeout to include 500/502/503, network and
fetch failures — the `resolveQueue` failover chain now earns its keep for those
cases (4xx/auth remain non-retryable).

## Files changed

- Modified: `src/engine/ProviderRouter.ts` (rewrite), `src/engine/types.ts`
  (`signal`/`tools` on `RouteOptions` + `EngineOptions`), `src/engine/AIEngine.ts`
  (threads `signal`/`tools`), `src/config/models.ts` (ProviderName),
  `src/app/api/chats/[chatId]/messages/route.ts` (passes `req.signal`)
- New: `src/engine/tools.ts`, `docs/migrations/phase-8.15-ai-engine.md`
- Deleted: `src/config/provider-clients.ts`

## Verification

```
npx tsc --noEmit              ✅ 0 errors
npx eslint src --max-warnings=0  ✅ 0 errors
npm run build                 ✅ succeeds
```

## Remaining debt

- **A4** — consolidate the 4–6 DB writes per generation (`trackUsage` +
  `usageGuard.record`) into one transaction/queue (perf, deferred).
- **A5** — token-budgeted history truncation in `ContextBuilder` (deferred).
- **A6** — knowledge `<knowledge>` delimiters + data-vs-instructions guard
  (deferred; security hardening).
- **A8** — merge the duplicated `AIEngineError.ts`/`AIProviderError.ts`
  taxonomies into one imported hierarchy with `userMessage` vs `internalMessage`
  (deferred; needs an API-layer error pass).
- **A9/A10** — intent extensibility and workflow budgets (roadmap).
