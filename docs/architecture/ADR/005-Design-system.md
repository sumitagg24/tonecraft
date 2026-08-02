# ADR-005: Design System

## Status
Accepted

## Context
ToneCraft requires a consistent visual language across the compose workspace, dashboard, settings, and billing pages. A design system ensures UI consistency, accelerates feature development, and reduces design debt.

## Decision
Adopt a design system built on Tailwind CSS with Radix UI primitives and custom component tokens. The system defines spacing, typography, color palettes, and component variants.

## Alternatives Considered
1. Pure Tailwind without primitives - Faster start but inconsistent accessibility.
2. Material UI - Rich component library but heavier bundle and less design flexibility.
3. Custom CSS-in-JS - Full control but higher maintenance cost and slower iteration.

## Tradeoffs
- Pro: Consistent theming, accessibility out of the box, fast iteration with utility classes.
- Con: Tailwind configuration drift, reliance on third-party primitives for complex components.

## Consequences
All new UI components must conform to the design system tokens. Custom components require design review before merge. The design system is versioned alongside the application code.