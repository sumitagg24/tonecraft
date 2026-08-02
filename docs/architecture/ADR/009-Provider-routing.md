# ADR-009: Provider Routing

## Status
Partial — Routing logic implemented; CapabilityRegistry is embedded in router/config rather than a standalone service.

## Context
The system must select an AI model based on required capabilities (vision, JSON mode, tool calling), cost, health, and user preferences.

## Decision
Routing is performed in `src/engine/ProviderRouter.ts` by evaluating `capabilityContext` and querying `ModelRegistry`. Capabilities are defined in `src/lib/capabilities.ts`.

## Evidence
- **Router**: `src/engine/ProviderRouter.ts` — `route()` (lines 33-83), `stream()` (lines 85-134)
- **Capability Resolution**: `resolveQueue()` (lines 136-163) uses `capabilities.resolveCapabilityTier()`
- **Model Registry**: `src/services/ModelRegistry.ts` — `resolve(plan)`, `getModelsByCapability()`
- **Capabilities Config**: `src/lib/capabilities.ts` — defines `capabilityTier` per intent

## Alternatives Considered
1. **Standalone CapabilityRegistry service** — Planned for future refactor
2. **Static capability mapping** — Rejected; too rigid

## Tradeoffs
- **Pro**: Capability-based routing with fallback chain ensures resilience
- **Con**: Capability logic is distributed across `capabilities.ts` and `ProviderRouter`; a dedicated registry would improve separation

## Consequences
Adding new capabilities requires updating both `capabilities.ts` and `ModelRegistry`. A future refactor will extract a standalone `CapabilityRegistry` service.

---

# ADR-010: Credits System

## Status
Accepted

## Context
Billing must expose a transparent, per-user credit ledger that integrates with Paddle subscriptions and tracks usage for AI generations.

## Decision
Maintain an internal credit ledger (`Usage` model) that logs each generation's token consumption. Paddle handles recurring subscriptions; the ledger supplements them with token-level granularity.

## Evidence
- **Models**: `Usage`, `UsageRecord`, `Subscription` in `prisma/schema.prisma` (lines 140-191)
- **Guard**: `src/services/UsageGuard.ts` — `canAfford()` (lines 62-67), `record()` (lines 69-117)
- **Integration**: `AIEngine.generate()` calls `usageGuard.canAfford()` (line 71) and `usageGuard.record()` (line 95)
- **Credits Config**: `src/config/credits.ts` — `getMonthlyCredits()`, `isUnlimited()`
- **Plan Service**: `src/services/PlanService.ts` — resolves user plan tier

## Alternatives Considered
1. **Paddle usage events only** — Rejected; insufficient granularity for per-token tracking
2. **Stripe metered billing** — Rejected; Paddle already handles subscriptions

## Tradeoffs
- **Pro**: Granular control, supports promotions and internal credit adjustments
- **Con**: Requires maintenance of credit balance, separate from Paddle's metering

## Consequences
All generation calls check credit balance before proceeding and update the ledger. The billing dashboard displays both subscription status and credit balance.