# Sidebar Component Blueprint

## Purpose
Navigation panel that provides access to conversations, tools, library items, and account settings. The sidebar is the primary navigation surface within each section.

## Variants

### Conversation Sidebar (Compose Section)
- Width: 280px desktop, full-width drawer on mobile
- Background: `bg-card` with `border-r border-border/40`
- Height: Full viewport height minus header
- Scroll: `overflow-y-auto` with `scroll-area`
- Sections: Pinned, Favorites, Today, Yesterday, This Week, Older
- Group labels: `caption` size, `semantic-muted` color, `px-3 py-2`
- Manage toggle: Expands to full index with filters (archived, tone) and bulk actions

### Section Sidebar (Library, Account)
- Width: 240px desktop, full-width drawer on mobile
- Background: `bg-card`
- Border: `border-r border-border/40`
- Sub-navigation: Segmented control or list
- Active item: `bg-muted/50 border border-border/40 shadow-sm`
- Inactive item: `hover:bg-muted/30 border border-transparent`

### Tools Sidebar
- Category pills at top: horizontal scrollable row
- Below: Grid of tool cards
- Tool opens inline in center pane (no page change)

## States

| State | Visual Behavior |
|-------|----------------|
| Default | Base styles above |
| Hover | `hover:bg-muted/30` for inactive items |
| Active | `bg-muted/50 border border-border/40 shadow-sm` |
| Collapsed | Width reduces to 0, content hidden |
| Drawer (mobile) | Slide-over from left, overlay backdrop |
| Empty | Illustration + "No items" message |
| Loading | Skeleton rows |

## Spacing Rules
- Item padding: `px-3 py-2.5`
- Item gap: `gap-2.5` (icon to text)
- Section gap: `space-y-1` (4px) between items
- Group gap: `space-y-3` (12px) between sections
- Border bottom: `border-b border-border/40` on section headers

## Typography
- Item label: `text-sm` (14px)
- Item metadata: `caption` (12px)
- Group label: `caption` (12px), `semantic-muted`, uppercase
- Active item label: `text-sm font-medium`

## Icon Rules
- Sidebar icons: 20px (`w-5 h-5`)
- Active icon: tone accent color
- Inactive icon: `semantic-muted`
- Icon-only controls: `aria-label` required

## Mobile Behavior
- Sidebar collapses to drawer
- Triggered by hamburger menu or `⌘B`
- Drawer slides over content
- Backdrop: `bg-base-bg/80 backdrop-blur-sm`
- Close on `Escape` or backdrop tap

## Dark Mode
- Sidebar background adapts to `bg-card` in dark
- Borders use `border-border/40` which adapts
- Active state uses `bg-muted/50` which adapts

## Anti-Patterns
- Never hide the sidebar on desktop (use collapse, not removal)
- Never use unlabeled icons for navigation (always include text labels)
- Never put navigation items in the sidebar that belong in the rail
- Never make the sidebar wider than 280px on desktop