# ADR-009: Provider Routing

## Status
Accepted

## Context
The multi-provider AI engine must select which provider/model to use for each request. Factors include task type (e.g., writing vs. code), required capabilities (vision, JSON mode), cost preferences, provider health/latency, and user remaining credits.

## Decision
Implement a Provider Router service that: 1) maps request context to required capabilities; 2) filters providers supporting those capabilities; 3) scores candidates by cost per token, health score, and user preference; 4) falls back to next best on failure or rate limit; 5) respects explicit user provider selection.

## Alternatives Considered
1. Static mapping (e.g., always use Gemini for long context) - Inflexible to cost or performance changes.
2. Round-robin with health checks - Ignores cost and capability matching.
3. User picks per request - Burdensome, not scalable for automated workflows.

## Tradeoffs
- Pro: Dynamic optimization, cost-aware, resilient to provider issues.
- Con: Adds latency for selection; requires up-to-date capability metadata.

## Consequences
All generation requests route through the router service. Provider health is polled via lightweight heartbeat endpoints. User preference overrides are stored in settings. Fallback chains prevent total service disruption.