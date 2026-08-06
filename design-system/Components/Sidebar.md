# Sidebar Specification

**Component:** `ConversationSidebar` / `ProjectSidebar` (`src/components/workspace/`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §12 (Layout)

---

## Purpose

Vertical navigation panel for conversations, projects, and workspace groups. Collapses to a toggleable drawer on mobile.

---

## Anatomy

```
<ConversationSidebar>
├─ <SidebarHeader>
│  └─ "Conversations" (label) + toggle button
├─ <SidebarGroup>  (Pinned)
│  └─ <SidebarItem> × N
├─ <SidebarGroup>  (Favorites)
│  └─ <SidebarItem> × N
├─ <SidebarGroup>  (Today)
│  └─ <SidebarItem> × N
├─ <SidebarGroup>  (This Week)
│  └─ <SidebarItem> × N
├─ <SidebarGroup>  (Older)
│  └─ <SidebarItem> × N
└─ <SidebarFooter>
   └─ "New Chat" button
```

---

## Dimensions

- Desktop: 280px fixed width
- Mobile: Slide-over drawer, 85vw max width
- Item height: 44px (minimum touch target)
- Group label: 12px (`caption`), `semantic-muted`
- Item padding: `space-3` (12px) horizontal, `space-2` (8px) vertical

---

## SidebarItem States

| State | Behavior |
|-------|----------|
| Default | `text-muted-foreground`, no background |
| Hover | `bg-muted/30`, `text-foreground` |
| Active | `bg-primary/10`, `text-primary`, accent border-left |
| Unread | Dot indicator (`semantic-info`) |
| Pinned | Pin icon, group at top |
| Favorite | Star icon |

---

## Spacing

- Group label padding: `space-3` (12px) horizontal, `space-2` (8px) vertical
- Group gap: `space-2` (8px) between label and items
- Between groups: `space-4` (16px)
- Footer: `space-4` (16px) padding

---

## Tokens

- `semantic-surface` — sidebar background
- `semantic-border` — group dividers (`border-border/10`)
- `semantic-text` — active item text
- `semantic-muted` — inactive item text
- `semantic-accent` — active item accent
- `radius-md` (8px) — item hover shape
- `duration.instant` (100ms) — hover transitions

---

## Accessibility

- `nav` element with `aria-label="Conversations"`
- `aria-current="page"` on active item
- Keyboard navigation: Up/Down arrows, Enter to select
- `aria-label` on icon-only toggle button
- Focus ring: `ring-2 ring-primary/30`

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥768px) | Fixed 280px pane, always visible when expanded |
| Mobile (<768px) | Collapses to drawer, slide-over from left (spring animation) |
| Focus Mode | Hidden entirely |
| Compact Mode | Hidden, context panel visible |

---

## Grouping Order

1. Pinned (always at top)
2. Favorites
3. Today
4. Yesterday
5. This Week
6. Older
