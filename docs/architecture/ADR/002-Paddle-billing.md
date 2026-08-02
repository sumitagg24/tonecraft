# ADR-002: Paddle Billing

## Status
Accepted

## Context
ToneCraft requires recurring and usage-based billing with global payment support, tax handling, and subscription management. A single vendor that handles all these aspects is preferred.

## Decision
Use Paddle as the primary billing provider for subscriptions and one-time purchases. Integrate usage events via Paddle’s event API to support token-based metering.

## Alternatives Considered
1. Stripe — highly flexible but requires custom tax handling and more developer effort.
2. Chargebee — good for SaaS but higher cost and less global coverage.

## Tradeoffs
- Pro: Global coverage, built-in tax, subscription lifecycle, compliance.
- Con: Vendor lock-in, less granular control over payment flows compared to Stripe.

## Consequences
Product pricing and plans must map to Paddle’s product catalog. Usage metering is implemented via event-based billing; the billing service must translate token usage into Paddle events.