# TopBar Specification

**Component:** `TopBar` (`src/components/shell/TopBar.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

The global header that appears above all dashboard content. Provides workspace context, page breadcrumb, and global actions (command palette, notifications, user menu).

---

## Anatomy

```
<TopBar>
├─ <Breadcrumb> or <PageTitle>
│  └─ Current page title
├─ [Spacer]
├─ <GlobalActions>
│  ├─ [CommandPalette Trigger]    ⌘K
│  ├─ [Notifications Trigger]
│  │  └─ unread badge if any
│  ├─ [Help/Shortcuts Trigger]    ⌘/
│  └─ [UserMenu]
│     └─ Avatar with dropdown
│     ├─ Profile
│     ├─ Settings
│     ├─ Billing
│     └─ Sign Out
└─ <MobileNavTrigger>            ☰ (mobile only)
```

---

## Layout Modes

| Context | Left Content | Right Content |
|---------|-------------|---------------|
| Dashboard pages | Page title or breadcrumb | Commands, notifications, user |
| Chat pages | Conversation title | Export, share buttons |
| Mobile | Hamburger menu (☰) | User menu |

---

## Dimensions

- Height: 48px (`h-12`)
- Padding: `space-4` (16px)
- Background: `bg-background/40` with `backdrop-blur-sm`
- Border-bottom: `border-border/20`
- Item spacing: `space-2` (8px) between actions

---

## Spacing

| Element | Spacing |
|---------|---------|
| Horizontal padding | `space-4` (16px) on mobile, `space-6` (24px) on desktop |
| Action gap | `space-2` (8px) |
| Avatar size | 32px (`w-8 h-8`) |
| Icon size | 20px (`w-5 h-5`) |

---

## Tokens

- `semantic-surface` — background (with transparency)
- `semantic-border` — bottom border
- `semantic-text` — title text
- `semantic-muted` — action icons
- `semantic-info` — notification badge
- `duration.instant` (100ms) — hover transitions
- `backdrop-blur-xl` — glass effect

---

## Accessibility

- `header` element with `aria-label="Page header"`
- Page title: `aria-level="2"` or uses `<h2>`
- Command palette trigger: `aria-label="Open command palette"`
- Notifications: `aria-label` with count
- User menu: `aria-haspopup="true"`, `aria-expanded`
- Mobile trigger: `aria-label="Open navigation menu"`
- Focus ring: `ring-2 ring-primary/30` on all interactive elements

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1024px) | Full TopBar with all controls |
| Tablet (≥768px) | Same as desktop |
| Mobile (<768px) | Hamburger menu on left, user menu on right, page title centered |
