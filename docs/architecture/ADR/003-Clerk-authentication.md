# ADR-003: Clerk Authentication

## Status
Accepted

## Context
ToneCraft needs scalable, secure authentication with SSO support, user management, and optional organization-level access. Building a custom auth system would be non-trivial.

## Decision
Use Clerk for authentication, user management, and SSO. Clerk handles email/password, OAuth providers, and optional organization switching.

## Alternatives Considered
1. Supabase Auth — good Postgres integration but limited SSO flexibility.
2. Auth0 — comprehensive but more complex setup and higher cost.
3. Custom JWT — full control but high maintenance and security burden.

## Tradeoffs
- Pro: Low friction, pre-built UI, strong org and SSO support, fast iteration.
- Con: Vendor lock-in, pricing can increase at scale.

## Consequences
All authenticated routes must consume Clerk session data. Authentication state is shared via React context and server-side helpers. Webhooks are used to sync user lifecycle events into the local database.