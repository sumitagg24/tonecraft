# ContextDrawer Specification

**Component:** `AIContextPanel` (`src/components/workspace/AIContextPanel.tsx`)
**Tier:** Feature Component
**Reference:** Design-System-v1.md §12 (Layout), §10 (AI Interaction)

---

## Purpose

Right-hand drawer panel in the ComposeWorkspace that shows conversation context, active AI settings, statistics, personas, and file attachments. Opens as an overlay on desktop (slide-in from right) and bottom sheet on mobile.

---

## Anatomy

```
<AIContextPanel>
├─ <PanelHeader>
│  ├─ <Sparkles icon>
│  ├─ "AI Context" (title)
│  └─ [Close button]  ← PanelRightClose icon, top-right
├─ <PanelContent> (scrollable)
│  ├─ <Section> "Conversation"
│  │  ├─ InfoRow: Title
│  │  ├─ InfoRow: Tone (with color dot)
│  │  ├─ InfoRow: Provider/Model
│  │  ├─ InfoRow: Messages count
│  │  └─ InfoRow: Created date
│  ├─ <Section> "Active Settings"
│  │  ├─ InfoRow: Platform
│  │  ├─ InfoRow: Language
│  │  ├─ InfoRow: Length
│  │  ├─ InfoRow: Formality
│  │  ├─ InfoRow: Emojis (On/Off)
│  │  ├─ InfoRow: Creativity (%)
│  │  └─ InfoRow: Audience
│  ├─ <Section> "Statistics"
│  │  ├─ InfoRow: User messages count
│  │  ├─ InfoRow: AI responses count
│  │  ├─ InfoRow: Word count
│  │  ├─ InfoRow: Characters
│  │  ├─ InfoRow: Est. tokens
│  │  └─ InfoRow: Reading time
│  ├─ <Section> "Personas"
│  │  └─ Persona list (selectable rows)
│  └─ <Section> "Attachments"
│     └─ File list (name + size)
├─ <PanelFooter>
│  └─ <UsageBadge>
│     ├─ Context usage %
│     ├─ Progress bar (gradient)
│     └─ Word count + token estimate
└─
```

---

## Variants

| Variant | Size | Animation | Usage |
|---------|------|-----------|-------|
| `desktop-overlay` | 320px | Slide-in from right | Desktop, overlay mode |
| `mobile-bottom` | 70vh | Slide-up from bottom | Mobile, bottom sheet |

---

## Section States

| State | Behavior |
|-------|----------|
| Expanded | Content visible, chevron rotated 180° |
| Collapsed | Content hidden, chevron at 0° |
| Empty (Personas) | "No personas yet..." message |
| Empty (Attachments) | "No attachments in this conversation." |

---

## Dimensions

- Panel width: 320px (desktop), 100vw (mobile)
- Header height: 48px
- Footer height: ~70px (with usage badge)
- Section header height: 40px
- Icon size: 14px (`w-3.5 h-3.5`) in section headers
- InfoRow icon: 14px (`w-3.5 h-3.5`)

---

## Spacing

| Element | Spacing |
|---------|---------|
| Header padding | `space-4` (16px) |
| Panel content | `space-3` (12px) side, `space-2.5` (10px) between sections |
| Section header | `px-3.5 py-2.5` (14px/10px) |
| Section content | `px-3.5 pb-3 pt-1` (14px/4px/12px) |
| InfoRow gap | `space-2.5` (10px) between icon and label |
| Footer padding | `space-4` (16px) |

---

## Tokens

- `bg-sidebar/30` — panel background (with blur)
- `border-border/20` — borders
- `semantic-primary` — accent color for active items
- `semantic-muted` — info row text
- `shadow-premium` — panel shadow (desktop overlay)
- `radius-xl` (16px) — section corners (inside panel)

---

## Accessibility

- Panel: `aria-label="AI Context panel"`
- Close button: `aria-label="Close context panel"`
- Sections: `aria-expanded` on collapsible headers
- Persona rows: `aria-pressed` for selection state
- Focus: `focus-visible` ring on all interactive elements
- Escape key: closes panel (handled by ComposeWorkspace)
- `aria-live` for context usage updates

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥768px) | Right overlay drawer, 320px width, slide from right |
| Mobile (<768px) | Bottom sheet, 70vh height, slide from bottom |
| Focus Mode | Hidden (panel closes automatically) |

---

## Interaction Notes

- Section headers are buttons that toggle collapse/expand
- Expansion animation: 200ms height + opacity transition
- Personas: click to select/deselect, selected gets primary background
- Attachments: read-only display (files managed from knowledge upload)
- Usage badge: gradient progress bar (`from-violet-500 to-indigo-500`)
- Context usage calculated as `estTokens / 16000 * 100` (percentage of context window)
