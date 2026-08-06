# NavigationRail Specification

**Component:** `NavigationRail` (`src/components/shell/NavigationRail.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

The persistent vertical navigation rail that provides access to all primary destinations. Visible on desktop, collapses to a bottom tab bar or drawer on mobile.

---

## Anatomy

```
<NavigationRail variant="desktop">
├─ <RailHeader>
│  └─ Logo / Brand
├─ <RailItems>
│  ├─ <RailItem href="/compose">     Compose  ⌘1
│  ├─ <RailItem href="/tools">       Tools   ⌘2
│  ├─ <RailItem href="/library">     Library  ⌘3
│  ├─ <RailItem href="/search">      Search   ⌘4
│  └─ <RailItem href="/analytics">   Analytics ⌘8
├─ <RailFooter>
│  └─ <RailItem href="/settings">     Settings  ⌘,
│  └─ <RailItem href="/billing">      Billing    ⌘B
└─ <RailShortcuts>
   └─ "Press ⌘K for command palette"
```

---

## Variants

| Variant | Width | Layout | Usage |
|---------|-------|--------|-------|
| `desktop` | 64px (collapsed) | Vertical, icons only | Desktop sidebar |
| `desktop-full` | 200px | Vertical, icons + labels | Desktop expanded |
| `mobile-drawer` | 280px max | Vertical, from left | Mobile nav drawer |
| `mobile-bottom` | Full width | Horizontal, icons + labels | Mobile bottom bar |

---

## RailItem States

| State | Behavior |
|-------|----------|
| Default | `text-muted-foreground`, no background |
| Hover | `bg-muted/30`, `text-foreground` |
| Active | `text-primary`, `bg-primary/10`, accent border |
| Badge | Unread count shown as red dot + number |

---

## Dimensions

- Desktop collapsed: 64px width, 48px item height
- Desktop expanded: 200px width, 48px item height
- Mobile bottom bar: 56px height
- Icon size: 20px (`w-5 h-5`)
- Item padding: `space-3` (12px) vertical, `space-3` (12px) horizontal
- Label gap: `space-2` (8px) between icon and label

---

## Spacing

| Element | Spacing |
|---------|---------|
| Item height | 48px (desktop), 56px (mobile) |
| Item padding | `space-3` (12px) all sides |
| Icon-label gap | `space-2` (8px) |
| Between sections | `space-4` (16px) |
| Header to items | `space-6` (24px) |

---

## Tokens

- `semantic-surface` — rail background
- `semantic-border` — section divider (`border-border/10`)
- `semantic-primary` — active item color
- `semantic-info` — notification badge
- `radius-md` (8px) — hover item shape
- `duration.instant` (100ms) — hover/active transitions

---

## Accessibility

- `nav` element with `aria-label="Main navigation"`
- `aria-current="page"` on active item
- `aria-label` on icon-only items (desktop collapsed)
- Keyboard: `Tab` to enter, arrow keys to navigate, `Enter` to select
- Badge: `aria-label` with count, e.g. "5 unread notifications"

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥768px) | Vertical rail, 64px collapsed or 200px expanded |
| Tablet (≥768px, <1024px) | Same as desktop |
| Mobile (<768px) | Hidden, accessible via hamburger menu → drawer, or bottom tab bar |

---

## Navigation Items

| Item | Route | Shortcut | Icon |
|------|-------|----------|------|
| Compose | `/chat` | ⌘1 | MessageSquare |
| Tools | `/tools` | ⌘2 | Sparkles |
| Library | `/library` | ⌘3 | BookOpen |
| Search | `/search` | ⌘4 | Search |
| Settings | `/settings` | ⌘, | Settings |
| Billing | `/billing` | ⌘B | CreditCard |
