# Settings Page Specification

**Route:** `/settings` (`src/app/(dashboard)/settings/page.tsx`)
**Layout:** AppShell (standard dashboard layout, no ComposeWorkspace)
**Reference:** Design-System-v1.md §13 (Themes)

---

## Purpose

Manage user profile, appearance preferences, notification settings, and custom AI personas. Provides account-level controls in a tabbed interface.

---

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ TopBar                                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ Page Header                                     │
│  "Settings"                                     │
│  "Manage your account and preferences."         │
│                                                 │
│ Tab Bar                                         │
│  [ Profile ] [ Appearance ] [ Notifications ]   │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Profile Tab                                     │
│  ┌──────────────────────────────────────────┐ │
│  │ Profile Information                      │ │
│  │  [Display Name input]                    │ │
│  │  [Email (read-only)]                     │ │
│  │  [Save Changes button]                   │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ Custom Personas                          │ │
│  │  [Persona chips with color dots]         │ │
│  │  [+ Add Persona button]                  │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│ Appearance Tab                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ Theme                                    │ │
│  │  (•) Light  (•) Dark  (•) System         │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│ Notifications Tab                               │
│  ┌──────────────────────────────────────────┐ │
│  │ Delivery Channels                        │ │
│  │  [x] In-app notifications              │ │
│  │  [x] Email notifications               │ │
│  │  [x] Push notifications                │ │
│  │  [x] Realtime notifications            │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ Categories                               │ │
│  │  [x] Generation finished               │ │
│  │  [x] Knowledge indexed               │ │
│  │  [x] Export completed                │ │
│  │  [x] Credits low                      │ │
│  │  [x] Team invites                     │ │
│  │  [x] Comments                         │ │
│  │  [x] Mentions                         │ │
│  │  [x] Subscription                     │ │
│  │  [x] System announcements            │ │
│  │  [x] Daily digest                     │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│ ─────────────────────────────────────────────── │
│                                                 │
│ Danger Zone (always visible below tabs)         │
│  "Danger Zone"                                  │
│  "Permanently delete your account..."          │
│  [Delete Account] (destructive variant)         │
└─────────────────────────────────────────────────┘
```

---

## Key Components

| Component | Path | Notes |
|-----------|------|-------|
| `SettingsPage` | `src/app/(dashboard)/settings/page.tsx` | Main settings view (inline component) |
| `Tabs` | `src/components/ui/tabs.tsx` | Tab container |
| `Card` | `src/components/ui/card.tsx` | Section containers |
| `Input` | `src/components/ui/input.tsx` | Text inputs |
| `Button` | `src/components/ui/button.tsx` | Action buttons |
| `Switch` | `src/components/ui/switch.tsx` | Toggle preferences |
| `Badge` | `src/components/ui/badge.tsx` | Status labels |

---

## Data Requirements

- `GET /api/notifications/preferences` — current notification prefs
- `PATCH /api/notifications/preferences` — update notification prefs
- `GET /api/personas` — list user personas
- `POST /api/personas` — create new persona
- `DELETE /api/personas/{id}` — delete persona
- `PATCH /api/user/profile` — update display name
- `DELETE /api/user/delete` — delete account (requires confirmation)

---

## Interaction Notes

- **Profile**: Display name editable, email read-only (managed via Clerk)
- **Personas**: Show color dot + name + description; default personas get "Default" badge; delete via icon button
- **Add persona form**: Collapsible inline form with name, description, system prompt textarea, and color picker
- **Appearance**: Theme selector (light/dark/system) — uses `next-themes`
- **Notifications**: Two-level toggles — channels first, then categories; optimistic update with rollback on failure
- **Danger zone**: Requires `window.confirm()` before delete; redirects to `/` after deletion
- **All changes**: Show toast on success/failure

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All sizes | Single column content, max width 512px (`max-w-2xl`) centered |
| Mobile (<768px) | Tabs become full-width buttons in a grid |
| Desktop (≥1024px) | Three-column tab layout |

---

## Design Tokens Used

- `h1` for page title, `h4` for section subheadings, `body-sm` for form labels
- `semantic-surface`, `semantic-text`, `semantic-muted`
- `semantic-error` for danger zone
- `semantic-border` for dividers
- `radius-lg` for cards
- `space-6` (24px) for section gaps
