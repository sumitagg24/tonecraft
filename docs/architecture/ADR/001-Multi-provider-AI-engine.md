# ADR-001: Multi-Provider AI Engine

## Status
Accepted

## Context
ToneCraft serves diverse writing tasks (creative, technical, code-assist). Relying on a single model risks cost spikes, vendor lock-in, and degraded quality across task types. Users expect provider flexibility and usage transparency.

## Decision
Adopt a unified multi-provider AI engine that abstracts OpenAI, Anthropic, Google Gemini, and other providers behind a single interface. Routing selects the cheapest capable model based on task, fallback routing, user preference, provider health, and remaining credits.

## Alternatives Considered
1. Single vendor (OpenAI only) — simpler integration, higher cost, lock-in.
2. Single vendor (Anthropic) — advanced reasoning but limited vision and higher latency.
3. OpenRouter as sole aggregator — reduced provider control, variable latency.

## Tradeoffs
- Pro: Cost efficiency, resilience, provider flexibility, future-proofing.
- Con: Increased complexity, routing logic maintenance, provider API drift risk.

## Consequences
All downstream components (Composer, Chat, Knowledge, Export) must consume the unified engine interface. Adding a new provider requires only a new adapter; no workflow changes needed.