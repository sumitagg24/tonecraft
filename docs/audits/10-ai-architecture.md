# AI Architecture Review — 10

Date: 2026-08-02 · Scope: `src/engine/*` (AIEngine, ProviderRouter, ContextBuilder, IntentEngine, WorkflowEngine, ResponseFormatter), `src/services/ModelRegistry.ts`, `UsageGuard.ts`, `ProviderHealthService.ts`, `ToolService.ts`, `src/config/models.ts`, `credits.ts`, `src/lib/capabilities.ts`, prompt library (`src/prompts/*`), and the API layer that drives it. Read-only; nothing modified.

---

## Current architecture (as built)

```
Route handler (chats/[chatId]/messages, tools, regenerate/continue)
   │  zod-validated, rate-limited (main send path only), ownership-checked (mostly)
   ▼
AIEngine.generate / AIEngine.stream          ← orchestrator
   │  workflow? → WorkflowEngine (sequential multi-step)
   │  intentEngine.resolve(key, overrides)   → IntentConfig (tone/platform/length/…)
   │  buildPrompt(intent, text, config)      → composed user prompt
   │  contextBuilder.build(...)              → systemMessage + messages (history[-20])
   │  usageGuard.canAfford(minCost)          ← credit pre-check
   ▼
ProviderRouter.route / .stream
   │  resolveQueue: explicit model → fallback chain | capability-tier ranking
   │  providerHealthService.isProviderUsable filters queue
   │  AI SDK streamText (AbortSignal.timeout(60s)), provider failover on 429/timeout
   ▼
usageGuard.record(actualCost)  +  AIEngine.trackUsage(UsageRecord + Usage counters)
ResponseFormatter.format(...) → EngineResult
```

**What's genuinely good (keep):**
- Clean layered pipeline; intent → prompt → context → route → format is easy to follow and test.
- **Credit guard is correct**: pre-check with *minimum* possible cost, post-record with *actual* cost, `FOR UPDATE` row-lock in `record()` (no double-spend race).
- **Streaming and non-streaming parity** — same intent/context/credit path, `stream()` is a thin async-generator over the router.
- Capability metadata + tier ranking + health-filtered failover queue is a solid routing design.
- Single-instance singletons (`aiEngine`, `providerRouter`, `contextBuilder`, `intentEngine`) keep wiring simple.
- Prompt templates are centralized in `src/prompts/*` (email/reply/rewrite/social/grammar/…).

---

## Findings

### A1. Two sources of truth for provider/model config — and they've drifted (High)

`ProviderRouter.PROVIDERS` (6 hardcoded entries) coexists with `config/models.ts` (6 entries). They disagree on model IDs:

| Legacy `PROVIDERS` (ProviderRouter) | `config/models.ts` |
|---|---|
| `llama-3.1-70b-versatile` | `llama-3.3-70b-versatile` |
| `gemini-1.5-flash` / `gemini-1.5-pro` | `gemini-2.5-flash` / `gemini-2.5-pro` |
| `anthropic/claude-3.5-sonnet` | `anthropic/claude-3.7-sonnet` |
| `openai/gpt-4o` | `openai/gpt-4o` (same) |

The legacy array only runs on the `!plan` / `isPro` backward-compat path (`resolveQueue`), which means anything routing without a plan can call **retired model IDs**. `provider-clients.ts` is a third, dead copy (audit 01 flagged it). Fix: delete the legacy array + `isPro` path, or re-derive `PROVIDERS` from `models.ts`; single source of truth is `config/models.ts` + `ModelRegistry`.

### A2. `anthropic` provider type exists but no client exists (Medium)

`ProviderName` includes `"anthropic"` and `getClient()` has no `anthropic` case → runtime `throw new Error("Unknown provider: anthropic")`. No model currently uses it (`openrouter-claude` routes through openrouter), so it's latent — but the type lies and a future model entry would hard-fail. Either add `createAnthropic` (the SDK is available via `@ai-sdk/anthropic` — not currently a dependency) or drop the union member.

### A3. 60-second hard timeout kills long streams; no client-disconnect chaining (Medium)

`AbortSignal.timeout(60000)` in both `route()` and `stream()` aborts a **working** generation at 60s regardless of progress, and the signal is not linked to the HTTP request's abort. A slow-but-progressing stream is cut; a client that disconnects doesn't cancel upstream (the route keeps spending provider tokens until the 60s cap). Fix: combine `req.signal` with an *idle* timeout (abort only if no chunk arrives for N seconds), and surface `finishReason`/abort reason distinctly in the streaming protocol. Client side: `sendMessage` in `use-chat.ts` has no timeout at all (audit 05 P2-1).

### A4. Per-message DB write amplification (Medium)

Every successful generation performs: `UsageRecord.create` + `Usage.upsert` (`AIEngine.trackUsage`) **plus** `usageGuard.record`'s `$transaction` (`SELECT … FOR UPDATE` + upsert) = 4–6 DB ops per message, on the request hot path. Fix: batch/queue usage + credit recording (a single `UsageGuard.record` that also upserts the counters), or move to a fire-and-forget queue with a reconciliation job. Also `trackUsage(...).catch(() => {})` swallows errors silently (audit 05 spirit).

### A5. History truncation by count, not tokens (Medium)

`ContextBuilder` slices `history.slice(-20)`. Twenty long messages can overflow a small context window; twenty one-liners waste it. `buildCapabilityContext` already estimates `tokenCount` (chars/4) but nothing uses it for trimming. Fix: token-budgeted context assembly (reserve headroom for system + knowledge + current prompt; drop oldest until under budget). This matters more as RAG + workflows grow context.

### A6. Knowledge grounding is a raw system block with no instruction guard (Medium)

`ContextBuilder` concatenates the `knowledgeBlock` into the system message with no delimiters and no "document text is data, not instructions" guard (security audit L1). Also no relevance threshold is surfaced and citations (`MessageKnowledge`) are schema-only today. Fix: wrap passages in `<knowledge>…</knowledge>`, add the data-vs-instructions sentence, keep per-source metadata in `EngineResult` for citation UI.

### A7. No real function/tool calling; capability flags are aspirational (Medium — roadmap)

`ModelCapabilities.tools`/`json`/`reasoning` are declared per model, but:
- `ToolService.execute` is **prompt-based** (calls `aiEngine.generate` with an intent) — no `tools` passed to `streamText`, no structured output.
- Nothing uses the `json` capability.
- `src/stores/capability-registry.ts` exists — verify it's wired to routing or is parallel scaffolding.

Fix (before agents/MCP): define a tool protocol (`name`, `description`, `inputSchema`, `handler`), a typed registry, and pass `tools` to the AI SDK with `toolChoice`; enable structured output for tools. This is the natural MCP onboarding point.

### A8. Error taxonomy is dead code; raw `Error.message` leaks to clients (Medium)

`AIEngineError.ts` + `AIProviderError.ts` define a duplicated, **unimported** error taxonomy (TS-audit M5). Provider failures surface as `(error as Error).message` into stream `{ type: "error", message }` and then into API responses (audit 05 P3-2, security M4). Fix: one `AIError` hierarchy carrying `provider`, `retryable`, `status`, `userMessage` vs `internalMessage`; the router maps SDK errors into it; the API layer logs `internalMessage` and returns `userMessage`.

### A9. IntentEngine: 50 hardcoded intents; extensibility unused (Low)

`INTENT_MAP` hardcodes ~50 entries (14 rewrite tones, 12 reply variants, …). `registerIntent()` exists but nothing calls it. The rewrite/reply families are enumerations over `TONES`/`PLATFORMS` constants and could be derived (single source of truth — today a new tone requires touching `constants.ts`, `ContextBuilder.getToneDescription`, and `INTENT_MAP`). Wire `registerIntent` to a user-defined-intent feature (custom personas could ship their own intents) or remove it.

### A10. WorkflowEngine: sequential-only, per-step billing, no budget cap (Low)

`executeMultiStep` runs steps serially; each step goes through `aiEngine.generate`, so each step does its own credit pre-check + record (correct, but a 3-step workflow costs 3× min checks). No step retry, no parallel branches, no whole-workflow credit budget. Fine for the 4 predefined workflows; document the per-step cost and add a `maxCredits` guard when workflows grow.

### A11. Observability: no spans/request tracing (Medium)

Latency/tokens land in `UsageRecord` (good for analytics) and `ProviderHealthService` tracks provider status, but there is no per-request trace through intent→context→router→provider, and no per-provider error-rate metric (only the warn log). Add a lightweight `requestId` span model (logger + `UsageRecord` already carry enough to reconstruct most of it) before launch-day debugging starts (audit 12).

### A12. Timeout/retry policy is narrow (Low)

`isRetryable()` matches 429/rate-limit/timeout only — 5xx and network errors skip retry and skip failover. `resolveQueue` already builds a failover queue; make `isRetryable` cover 5xx/network so the queue earns its keep. Keep it non-retryable for 4xx (auth/validation) and content errors.

---

## Roadmap readiness

| Future direction | Gap today | Entry point |
|---|---|---|
| **RAG** | No vector index (DB audit D1); knowledge = raw system block (A6) | pgvector + `<knowledge>` delimiters + citation metadata |
| **MCP** | No tool protocol / no `tools` in `streamText` (A7) | tool registry + schema; A7 fix is the MCP adapter |
| **Agents** | No multi-turn loop, no tool feedback loop, no memory layer | A7 + a loop that feeds tool results back as messages |
| **Workflows** | Sequential-only, no parallelism/conditions (A10) | extend `WorkflowStep` with `parallel`/`if` + budget |
| **Cost engine** | Flat integer `creditCost`; no per-token pricing, no cost analytics | extend `ModelEntry` with per-1k-token price + UsageRecord sums |

## Recommended order

1. **A1** — delete the legacy `PROVIDERS`/`isPro` path (correctness: retired model IDs).
2. **A8** — one error hierarchy + clean client error messages (security + UX).
3. **A6** — knowledge delimiters + instruction guard (self-injection defense-in-depth).
4. **A3** — idle-timeout instead of hard 60s; wire `req.signal` (reliability).
5. **A5** — token-budgeted context (cost + correctness).
6. **A4** — consolidate usage/credit writes (perf).
7. **A7** — tool protocol (enables MCP/agents).
