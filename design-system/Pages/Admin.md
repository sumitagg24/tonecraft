# Admin Page Specification

**Route:** `/admin` (`src/app/(dashboard)/admin/page.tsx`)
**Layout:** AppShell (standard dashboard layout, no ComposeWorkspace)
**Access:** Workspace administrators only
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

Workspace-level administration dashboard. Displays key metrics across members, projects, chats, messages, knowledge storage, and AI usage. Provides quick-access buttons for common admin tasks (member management, permissions, audit logs).

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Page Header                                    │
│  "Workspace Admin"                              │
│  "{workspace.name} — Overview of workspace..."  │
│                                                 │
│ Period Selector: [7 days] [30 days] [90 days]   │
│                                                 │
│ Metric Cards (4-column grid)                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐        │
│  │Members│ │Projects│ │ Chats │ │ Messages │        │
│  │  42   │ │   8   │ │  156  │ │  2,341   │        │
│  └──────┘ └──────┘ └──────┘ └────────┘        │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐  │
│  │Know.Files│ │ Storage │ │AI Tokens │ │AI Reqs │  │
│  │   24     │ │ 1.2 GB  │ │  342K   │ │  45   │  │
│  └────────┘ └──────────┘ └──────────┘ └───────┘  │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Three-Card Section                              │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────┐   │
│  │ Subscriptions │ │ Quick Actions  │ │ Workspace │  │
│  │ 3 active     │ │ [Manage Members]│ │ color dot │  │
│  │             │ │ [Permissions]   │ │ ID: abc123│  │
│  └─────────────┘ └──────────────┘ └──────────┘   │
│                                                 │
│ AI Activity Section (if requests > 0)           │
│  ┌──────────────────────────────────────────┐  │
│  │ Recent AI Activity                       │  │
│  │ Tokens: ████████████ 342K                │  │
│  │ Requests: ██████████ 45                  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│ Footer: "Last updated: [time]"                  │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `AdminOverviewPage` | `src/app/(dashboard)/admin/page.tsx` | Main admin view (inline component) |
| `Card` | `src/components/ui/card.tsx` | Metric cards, section cards |
| `Button` | `src/components/ui/button.tsx` | Quick action buttons |
| `Badge` | `src/components/ui/badge.tsx` | Workspace ID badge |
| `motion.div` | `framer-motion` | Staggered card entrances |

---

## Sub-Routes

The `/admin` route group has nested layouts for detailed views. Each sub-route has its own page:

| Sub-route | Purpose |
|-----------|---------|
| `/admin/members` | Member management, invites, role changes |
| `/admin/permissions` | Permission matrix, role definitions |
| `/admin/audit` | Audit log listing with filters |
| `/admin/projects` | Project management, quotas |
| `/admin/storage` | Storage breakdown, cleanup tools |
| `/admin/credits` | Credit balance, usage history |
| `/admin/usage` | Detailed usage metrics and charts |
| `/admin/features` | Feature flag management |
| `/admin/knowledge` | Knowledge base management |
| `/admin/charts` | Chart visualizations |

---

## Data Requirements

- `GET /api/workspaces` — list workspaces (admin selects first)
- `GET /api/admin/metrics/overview?workspaceId=X&period=30d` — main overview data
- Response includes: `workspace`, `members`, `projects`, `chats`, `messages`, `knowledge`, `aiUsage`, `billing`

---

## Interaction Notes

- **Period selector**: Buttons toggle between 7d/30d/90d, refetches metrics
- **Quick Actions**: Navigate to `/admin/members`, `/admin/permissions`, `/admin/audit`
- **Workspace card**: Shows color dot, name, and truncated ID
- **Metric cards**: Animate in with `framer-motion` stagger (4-col grid)
- **Empty state**: If no workspace found, shows error toast and returns early
- **Format helpers**: `formatNumber()` (K/M), `formatBytes()` (KB/MB/GB)

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | 2-column metric grid, vertical quick actions |
| Tablet (≥768px, <1024px) | 2-column metric grid |
| Desktop (≥1024px) | 4-column metric grid |
| Container | Max width 1280px (default padding `p-6`) |

---

## Design Tokens Used

- `h1` for page title, `body-sm` for descriptions, `text-xs` for metric labels
- `semantic-surface`, `semantic-muted`, `semantic-primary`
- `elevation-2` for metric cards
- `radius-lg` for cards
- `duration.normal` for staggered entrances
- Icons from `lucide-react` at 16px (`w-4 h-4`)
