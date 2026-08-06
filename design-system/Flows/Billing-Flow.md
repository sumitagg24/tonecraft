# Billing Flow

**Entry point:** User clicks "Billing" in NavigationRail or Settings
**Exit point:** User has active subscription or manages existing one
**Reference:** Design-System-v1.md §3 (Color System)

---

## Flow Diagram

```
User navigates to Billing
       │
       ▼
  ┌──────────────────┐
  │ 1. Billing page  │
  │    - Show plan   │
  │    - Show usage  │
  │    - Show tiers  │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ User selects     │
  │ plan to upgrade  │
       │
       ├── Free? → No action (disabled button)
       │
       ▼
  ┌──────────────────┐
  │ 2. Checkout      │
  │    POST /api/    │
  │    billing/      │
  │    checkout      │
  │    → Stripe URL  │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 3. Stripe        │
  │    checkout UI   │
  │    (external)    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ 4. Return to     │
  │    app           │
  │    ?checkout=    │
  │    completed     │
  │    or            │
  │    canceled      │
  └──────────────────┘
       │
       ├── Completed → Toast: "Subscription activated"
       │
       ▼
  ┌──────────────────┐
  │ 5. Billing page  │
  │    refreshes      │
  │    Shows "Current│
  │    Plan" badge   │
  │    + usage data  │
  └──────────────────┘
```

---

## Step-by-Step

### Step 1: Billing Page Load

**URL:** `/billing`

**Components:**
```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Page Header                                     │
│  "Pricing"                                      │
│  "Choose the plan that fits your needs."        │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Pricing Cards (3-col grid)                      │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐      │
│  │ Free     │ │ Pro ⭐   │ │ Enterprise │      │
│  │ $0       │ │ $20/mo   │ │ Custom      │      │
│  │ [Current]│ │ [Get Pro]│ │ [Contact]   │      │
│  └──────────┘ └──────────┘ └────────────┘      │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Current Usage                                   │
│  ┌──────┐ ┌──────┐ ┌───────┐ ┌───────┐         │
│  │ 100/ │ │ 50K  │ │ 10    │ │ 50 MB │         │
│  │ ∞    │ │      │ │ /∞     │ │ /5 GB │         │
│  └──────┘ └──────┘ └───────┘ └───────┘         │
│                                                 │
│ Manage Subscription (if Pro)                    │
│  [Open Customer Portal]                         │
└─────────────────────────────────────────────────┘
```

**Data flow:**
1. `GET /api/usage` → fetch current plan + usage
2. `GET /api/workspaces` → fetch workspace (for billing context)
3. Pricing tiers from `src/lib/constants.ts` (`PRICING_TIERS`)

---

### Step 2: Plan Selection

**Free tier:**
- Button always disabled
- Label: "Free Forever"
- All features limited

**Pro tier:**
- "Most Popular" badge (gold/violet gradient)
- Features list with checkmarks
- Button: "Get Pro" → loading spinner → redirect to Stripe
- Current plan: "Current" badge if already subscribed

**Enterprise tier:**
- "Contact" button → opens Calendly/sales form
- Custom pricing

**On click "Get Pro":**
```
Button state: [Getting started → spinner → "Redirecting..."]
→ POST /api/billing/checkout { plan: "pro" }
→ Receive { url: "https://checkout.stripe.com/..." }
→ window.location.assign(url)
```

---

### Step 3: Stripe Checkout (External)

**What happens:**
- User leaves app, goes to Stripe-hosted checkout
- Fills payment details
- Stripe processes payment
- Stripe redirects back to app

---

### Step 4: Return to App

**URL params on return:**
- `?checkout=completed` → success toast: "Subscription activated! Welcome to Pro."
- `?checkout=canceled` → error toast: "Checkout was canceled."
- `?success=true` → success toast
- `?canceled=true` → error toast

**Behavior:**
- Page re-renders, fetches fresh `/api/usage`
- Pro card now shows "Current" badge
- Usage section shows new limits

---

### Step 5: Manage Subscription (Post-Purchase)

**For Pro users only:**
- "Manage Subscription" card appears
- Button: "Open Customer Portal"
- `POST /api/billing/portal` → receives `{ url }`
- Redirects to Stripe Customer Portal
- User can: change card, cancel, update payment method

---

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 100 messages/day, 10K tokens/day, 100MB storage |
| Pro | $20/month | Unlimited messages, 100K tokens/day, 5GB storage |
| Enterprise | Custom | Custom limits, priority support, SSO, dedicated infrastructure |

---

## Usage Display

| Metric | Free | Pro |
|--------|------|-----|
| Messages | `100/∞` | `∞/∞` |
| Tokens | `50K` | `100K` |
| Files | `10/∞` | `1000/∞` |
| Storage | `50 MB/100 MB` | `5 GB/5 GB` |

Usage fetched from `GET /api/usage` in real-time on page load.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Checkout API error | Toast: "Checkout failed" |
| Portal API error | Toast: "Failed to open portal" |
| Usage API error | Show "Failed to load usage data" |
| Canceled checkout | Toast: "Checkout was canceled" |
| Successful checkout | Toast: "Subscription activated!" |
