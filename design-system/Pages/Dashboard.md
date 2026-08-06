# Dashboard Page Specification

**Route:** `/analytics` (`src/app/(dashboard)/analytics/page.tsx`)
**Layout:** AppShell (Desktop: NavigationRail + TopBar + Content)
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

Centralized overview of workspace metrics: message volume, token usage, model distribution, storage, and subscription status. Provides at-a-glance health and drill-down entry points.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar (workspace selector + header)            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Page Header: "Analytics" + description          │
│                                                 │
│ Period Selector: [7d] [30d] [90d]               │
│                                                 │
│ Metric Cards (4-col grid → 2-col md → 1-col)   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Messages │ │ Tokens   │ │ Files    │ │ Latency │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│                                                 │
│ Charts (2-col grid)                             │
│  ┌─────────────────┐ ┌─────────────────┐       │
│  │ Model Usage     │ │ Provider        │       │
│  │ (bar chart)     │ │ Distribution    │       │
│  └─────────────────┘ └─────────────────┘       │
│                                                 │
│ Error Rate (full width)                         │
│  ┌─────────────────────────────────────────┐  │
│  │ Progress bar 42%                        │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│ Subscription Card (full width, if active)      │
│  ┌─────────────────────────────────────────┐  │
│  │ Plan: pro · Status: active              │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│ Last updated: [timestamp]                       │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| Metric cards | Inline in page | 4-col grid, `elevation-2`, `radius-lg` |
| Charts | Inline | `semantic-surface` background, `elevation-1` |
| Period selector | Inline | Button group with active state |

---

## Data Requirements

- `GET /api/analytics/me?period=30d`
- Returns: `totalMessages`, `totalTokens`, `totalFiles`, `totalStorage`, `avgLatency`, `errorRate`, `modelUsage`, `providerUsage`, `subscription`, `dailyBreakdown`

---

## Interaction Notes

- Period selector updates the API query parameter and refetches data
- All numeric values formatted with `formatNumber()` (K/M suffix)
- Storage formatted with `formatBytes()`
- No drill-down links to other pages currently (future enhancement)

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Single column, metric cards stack |
| Tablet (≥768px, <1024px) | Two-column metric grid, two-column charts |
| Desktop (≥1024px) | Four-column metric grid, two-column charts |
| Container | Max width 1280px (`max-w-4xl`) |

---

## Design Tokens Used

- `h1`, `body-sm` typography
- `semantic-surface`, `semantic-muted`, `semantic-border` colors
- `elevation-1`, `elevation-2` shadows
- `radius-lg`, `radius-xl` for cards
- Icons from `lucide-react` at 16px (`w-4 h-4`)
