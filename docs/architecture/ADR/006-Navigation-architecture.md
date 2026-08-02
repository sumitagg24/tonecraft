# ADR-006: Navigation Architecture

## Status
Accepted

## Context
ToneCraft requires multi-level navigation with persistent compose workspace, sidebar main sections (Dashboard, Chat Groups, Tools, Settings), and deep linking for project references. Users navigate between the app and authentication routes.

## Decision
Use Next.js App Router with nested layouts for navigation. Root layouts handle persistent UI (sidebar, header). Dynamic route segments (/workspace/[projectId]) enable project-specific navigation. Server-side redirects for auth routes use middleware.

## Alternatives Considered
1. Pages Router - Legacy, no nested layouts, harder code splitting.
2. Custom client-side router - Loses SSR benefits, SEO impact, navigation inconsistencies.

## Tradeoffs
- Pro: Native SSR/SSG, type-safe linking, split loading for lazy routes.
- Con: Learning curve for nested layouts, session-awareness in server components.

## Consequences
Navigation state is managed via URL segments. Deep linking uses catch-all routes [...path] to handle dynamic workspace paths. Routes with authentication use Clerk middleware wrappers.