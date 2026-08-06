# Billing Page Specification

**Route:** `/billing` (`src/app/(dashboard)/billing/page.tsx`)
**Layout:** AppShell (standard dashboard layout, no ComposeWorkspace)
**Reference:** Design-System-v1.md §3 (Color System), §17 (Final Principles)

---

## Purpose

Display pricing tiers, current plan status, and usage metrics. Allows free-tier users to upgrade and paid-tier users to manage their subscription.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Page Header (centered)                          │
│  "Pricing"                                      │
│  "Choose the plan that fits your needs."        │
│                                                 │
│ Pricing Tier Cards (3-column grid)              │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│  │    Free      │ │    Pro       │ │ Enterprise ││
│  │  $0          │ │  $20/month   │ │ Custom     ││
│  │  [Free]      │ │ [Get Pro]    │ │  [Contact] ││
│  │              │ │ MOST POPULAR │ │            ││
│  └──────────────┘ └──────────────┘ └────────────┘│
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Current Usage Card                              │
│  "Current Usage"  "Plan: pro"                   │
│  ┌──────┐ ┌──────┐ ┌───────┐ ┌───────┐          │
│  │ msgs │ │tokens│ │files   │ │storage  │          │
│  │ 100/ │ │ 50K  │ │ 10    │ │ 50 MB  │          │
│  │ ∞    │ │      │ │/∞     │ │/5 GB   │          │
│  └──────┘ └──────┘ └───────┘ └───────┘          │
│                                                 │
│ Manage Subscription Card (Pro only)             │
│  "Manage Subscription"                          │
│  [Open Customer Portal]                         │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `BillingContent` | `src/app/(dashboard)/billing/page.tsx` | Main billing view (inline component) |
| `PRICING_TIERS` | `src/lib/constants.ts` | Pricing tier definitions |
| `Card` | `src/components/ui/card.tsx` | Tier cards, usage card |
| `Button` | `src/components/ui/button.tsx` | CTA buttons |
| `Badge` | `src/components/ui/badge.tsx` | "Most Popular", "Current" labels |

---

## Data Requirements

- `GET /api/usage` — current usage data
- `POST /api/billing/checkout` — redirect to checkout session
- `POST /api/billing/portal` — redirect to customer portal
- Pricing tiers from `src/lib/constants.ts` (`PRICING_TIERS`)
- URL query params: `?success=true` or `?checkout=completed` (show success toast), `?canceled=true` or `?checkout=canceled` (show error toast)

---

## Interaction Notes

- **Free tier**: Always disabled (can't subscribe)
- **Current plan**: Marked with "Current" badge
- **Popular tier**: Marked with "Most Popular" badge, uses primary border + `shadow-lg shadow-primary/10`
- **Upgrade flow**: Click CTA → redirect to Stripe checkout → return to billing page with `?checkout=completed`
- **Manage subscription**: Pro users see "Open Customer Portal" button → redirect to Stripe portal
- **Usage limits**: Free tier shows `∞` for unlimited, Pro shows numeric limits
- **Loading states**: Skeleton for usage data, spinner for checkout action

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Pricing cards single column, usage cards stacked |
| Tablet (≥768px) | Two-column pricing cards |
| Desktop (≥1024px) | Three-column pricing cards, four-column usage grid |
| Container | Max width 1280px (`max-w-4xl`) |

---

## Design Tokens Used

- `h1` for page title, `body-sm` for descriptions
- `semantic-surface`, `semantic-primary`, `semantic-error`
- Brand gradient for Pro CTA button
- `elevation-1`, `elevation-lg` for cards
- `radius-lg` for cards
- `duration.fast` (200ms) for button hover states
