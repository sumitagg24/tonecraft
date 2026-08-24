# ADR-002: Payment Provider — Paddle → Dodo Payments Migration

## Status
Superseded (migrated to Dodo Payments)

## Context
ToneCraft requires recurring and usage-based billing with global payment support, tax handling, and subscription management. A single vendor that handles all these aspects is preferred.

## Original Decision (Paddle)
Use Paddle as the primary billing provider for subscriptions and one-time purchases.

**Reason for migration**: Paddle domain review rejected tonecraft.site for "unsolicited outbound marketing" features. Despite code fixes, the domain remained blocked. Dodo Payments provides equivalent functionality without domain approval gates.

## Current Decision (Dodo Payments)
Use Dodo Payments as the primary billing provider for subscriptions and one-time purchases.

## Alternatives Considered
1. Stripe — highly flexible but requires custom tax handling and more developer effort.
2. Chargebee — good for SaaS but higher cost and less global coverage.
3. Paddle — rejected due to domain review block.

## Tradeoffs
- Pro: Global coverage, subscription lifecycle, hosted checkout, Standard Webhooks.
- Con: Vendor lock-in, less mature ecosystem than Stripe.

## Consequences
Product pricing and plans map to Dodo's product catalog. Webhook handler at `/api/webhooks/dodo` syncs subscription state to database. All Paddle dependencies removed from codebase.
