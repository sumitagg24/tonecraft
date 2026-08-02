# ADR-007: Workspace Architecture

## Status
Accepted

## Context
ToneCraft supports multiple project-like workspaces per user (e.g., separate writing projects). Workspaces need isolation, configurable templates, and shared settings. Users must be able to switch between workspaces.

## Decision
Model workspaces as top-level route segments (/workspace/[id]) with isolated data stores and settings. Each workspace has its own theme, saved contexts, and import defaults. Workspace switching uses React context for global state.

## Alternatives Considered
1. Single global workspace per user - Simpler state management but limited project scoping.
2. Hierarchical namespace - Overly complex for current feature set.

## Tradeoffs
- Pro: Clear project isolation, easy UI display of workspace names.
- Con: More complex indexing and permission logic in backend.

## Consequences
Workspace creation triggers storage allocation in Postgres. Navigation routes map to /workspace/[id] segments. Workspace selection persists in localStorage for loading speed. Multiple workspaces can be active simultaneously but only one renders the Compose UI.