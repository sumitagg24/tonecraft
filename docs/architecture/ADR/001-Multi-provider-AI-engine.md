# ADR-001: Multi-Provider AI Engine

## Status
Accepted (with partial implementation)

## Context
ToneCraft serves diverse writing tasks and must avoid vendor lock‑in. Users expect flexibility to switch between AI providers while maintaining usage transparency and cost efficiency. The architecture requires a unified interface that selects providers based on capability needs, cost, and health.

## Decision
Adopt a unified multi‑provider AI engine that abstracts OpenAI, Anthropic, Google Gemini, and other providers behind a single interface. Routing selects the cheapest capable model based on:
- Task‑level capability requirements (vision, JSON mode, tool calling)
- User preference
- Remaining credits
- Provider health status

The router is implemented in `src/engine/ProviderRouter.ts`. Provider capabilities are resolved via `src/services/ModelRegistry.ts`, which reads from `src/config/models.ts`.

## Alternatives Considered
1. **Static provider mapping** – Simple but inflexible to cost or capability changes.
2. **Round‑robin with health checks** – Ignores cost and capability level.
3. **User‑initiated provider selection only** – Burdens users for all requests.

## Tradeoffs
- **Pro**: Cost efficiency, resilience to provider outages, flexibility for future providers.
- **Con**: Increases routing complexity; requires up‑to‑date capability metadata.

## Consequences
All generation requests pass through `ProviderRouter.route()` (or `stream()`). Adding a new provider requires only a new model entry in `ModelRegistry`. The routing logic ensures fallback to a capable provider if the primary choice fails.

## Evidence
- **Routes & Logic**: `src/engine/ProviderRouter.ts` (lines 154‑160, 156‑159) resolves queue based on `intents` and capacity.
- **Model Registry**: `src/services/ModelRegistry.ts` (lines 47‑49) provides `resolve(plan, modelId?)`.  
- **Capabilities**: `src/lib/capabilities.ts` defines `capabilities.resolveCapabilityTier(intent, capabilityContext)`.
- **Provider Health**: `src/services/ProviderHealthService.ts` is consulted by the routing queue filter.