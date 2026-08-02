# ADR-010: Credits System

## Status
Accepted

## Context
ToneCraft uses Paddle for billing but also supports per-token credits for fine-grained usage tracking and to maintain a balance for users who buy directly (e.g., token packs). The system must expose credit usage, rollover, and bulk discounts while integrating with Paddle subscriptions.

## Decision
Maintain Paddle for subscriptions but add an internal credits ledger powered by Postgres. Each user has a credits balance that can be increased via purchases (one-time token packs, subscriptions, or manual credit additions). Every AI generation consumes credits according to the provider/model token rate.

## Alternatives Considered
1. Only Paddle usage events - Higher cost for per-token accuracy; usage is reported rather than metered.
2. Stripe with custom metering - More granular but adds complexity for tax and global payments.

## Tradeoffs
- Pro: Granular control, supports promotions and internal credit adjustments, gives users transparency over token consumption.
- Con: Requires maintenance of credit balance, separate from Paddle's metering (could lead to double charging if not careful).

## Consequences
All generation calls must check credit balance before proceeding and update the ledger. The billing dashboard displays both subscription usage and credit balance. Internal services (e.g., admin) can add/remove credits. Integration with Paddle webhooks ensures synchronization on subscription events.