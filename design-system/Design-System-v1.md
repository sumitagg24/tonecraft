# ToneCraft Design System v1.0 — FROZEN

> **Status:** Frozen — do not modify unless a real problem is discovered during implementation.
> **Version:** 1.0.0
> **Last Updated:** 2026-08-06
> **Artistic Direction:** Editorial Luxury (60%) + Apple (20%) + Arc Browser (10%) + Futuristic Motion (10%)

---

## 1. Design DNA

> **"Every interaction shapes expression. Every pixel serves voice."**

ToneCraft is not a tool. It is a language studio where the interface adapts to the emotional intent of the writer. The design system exists to make the creative process feel effortless, expressive, and deeply personal.

### Core Principles

1. **Human-Centric AI** — AI should amplify human creativity, not replace it
2. **Precision Over Decoration** — Every element has a functional purpose
3. **Contextual Intelligence** — UI adapts to creative workflow, not forces workflow changes
4. **Emotional Resonance** — Design evokes the feeling of effective communication
5. **Discoverability** — Every capability must be findable within 3 seconds
6. **Reversibility** — Allow creative experimentation without fear of mistakes

### Visual Hierarchy

- **Size**: 6XL (48px) → 4XL (36px) → 2XL (28px) → XL (20px) → BASE (16px) → SM (14px) → XS (12px)
- **Weight**: Bold (700) for headings → Semibold (600) for labels → Medium (500) for body → Regular (400) for secondary text
- **Color Priority**: Primary accent (tone color) → Semantic colors (success/warning/error/info) → Primary text → Muted text → Border
- **Motion Intensity**: Subtle → Moderate → Prominent based on importance

---

## 2. Visual Identity

The ToneCraft interface follows an editorial luxury aesthetic — clean, precise, and emotionally resonant. Every visual decision reinforces the relationship between the writer's intent and the AI's response.

- 85% of the interface uses neutral base tones (navy, slate, gray)
- 10% uses functional semantic colors (success, warning, error, info)
- 5% uses the active tone accent color — this is what makes the UI feel alive
- Never use raw hex values outside of `src/styles/colors.ts`
- Tone accent colors transition smoothly (300ms ease) when the user switches tones

---

## 3. Color System

### Base Palette

| Token | Value | Usage |
|-------|-------|-------|
| `base-bg` | `#0B0F1A` | Deep navy background — the canvas |
| `base-surface` | `#111827` | Primary surface cards |
| `base-elevated` | `#1E293B` | Elevated surfaces, popovers |
| `base-border` | `#1E3A5F` | Subtle borders with blue undertone |
| `base-text` | `#F1F5F9` | Primary text |
| `base-muted` | `#94A3B8` | Secondary text, captions |
| `base-accent` | `#38BDF8` | Sky blue — AI active state |

### Tone-Color Mapping

Each writing tone dynamically shifts the UI accent color, creating an emotional atmosphere that matches the voice.

| Tone | Accent Color | Mood | UI Behavior |
|------|-------------|------|-------------|
| Friendly | `#34D399` (emerald) | Warm, approachable | Soft green glow on composer border |
| Professional | `#60A5FA` (blue) | Authoritative, clean | Blue accent on active elements |
| Luxury | `#D4AF37` (gold) | Opulent, refined | Gold shimmer on premium surfaces |
| Sarcastic | `#F97316` (orange) | Bold, unexpected | Orange pulse on tone chip |
| Poetic | `#EC4899` (pink) | Lyrical, expressive | Pink gradient on message bubbles |
| Minimal | `#CBD5E1` (slate) | Clean, restrained | Muted accent, maximum whitespace |
| Corporate | `#818CF8` (indigo) | Structured, formal | Indigo borders and headers |
| Academic | `#14B8A8` (teal) | Precise, scholarly | Teal highlights on citations |
| Creative | `#A78BDA` (violet) | Imaginative, bold | Violet ambient glow on canvas |

### Semantic Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `semantic-bg` | `hsl(var(--background))` | Page background |
| `semantic-surface` | `hsl(var(--card))` | Card and panel backgrounds |
| `semantic-text` | `hsl(var(--foreground))` | Primary text |
| `semantic-muted` | `hsl(var(--muted-foreground))` | Secondary text |
| `semantic-primary` | `hsl(var(--primary))` | Primary actions |
| `semantic-border` | `hsl(var(--border))` | Surface borders |
| `semantic-accent` | Dynamic (tone-dependent) | Current tone accent |
| `semantic-success` | `#4ADE80` | Success states |
| `semantic-warning` | `#FBBF24` | Warning states |
| `semantic-error` | `#F87171` | Error states |
| `semantic-info` | `#38BDF8` | Informational states |

---

## 4. Typography

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `display` | 56px | 1.1 | 700 | Hero headings |
| `h1` | 40px | 1.15 | 600 | Page titles |
| `h2` | 32px | 1.2 | 600 | Section headers |
| `h3` | 24px | 1.25 | 600 | Card titles |
| `h4` | 20px | 1.3 | 500 | Subsection headers |
| `h5` | 16px | 1.4 | 500 | Component headers |
| `body-lg` | 18px | 1.5 | 400 | Lead paragraphs |
| `body` | 16px | 1.5 | 400 | Default body text |
| `body-sm` | 14px | 1.5 | 400 | Secondary body |
| `caption` | 12px | 1.4 | 400 | Captions, metadata |

### Font Families

| Role | Font | Fallback |
|------|------|----------|
| UI Text | Inter | system-ui, sans-serif |
| Mono | JetBrains Mono | monospace |

### Typography Rules

- Headings use `tracking-tight` for editorial quality
- Body text uses `tracking-normal` for readability
- Minimum legible size: 12px (`caption`) — legacy 9-11px sizes are deprecated
- Line height minimum 1.4 for all text sizes
- Maximum line length: 72 characters for body text
- Use weight for hierarchy, not font family changes

---

## 5. Spacing

### Base Grid (4px)

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |
| `space-24` | 96px |

### Spacing Rules

- All padding and margin uses multiples of 4px
- Component internal padding: `space-4` (16px) standard, `space-6` (24px) for cards
- Section gaps: `space-8` (32px) between sections, `space-12` (48px) between major sections
- Maximum content width: 1280px centered
- Sidebar width: 280px fixed (desktop), collapsed to 0 with drawer on mobile
- Context drawer width: 320px (desktop), full-width sheet on mobile
- No ad-hoc spacing — extend the scale when needed

---

## 6. Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-xs` | 4px | Badges, dots |
| `radius-sm` | 6px | Inputs, small controls |
| `radius-md` | 8px | Buttons, list items |
| `radius-lg` | 12px | Cards, panels |
| `radius-xl` | 16px | Composer, large cards |
| `radius-2xl` | 20px | Message bubbles |
| `radius-3xl` | 24px | Hero panels |
| `radius-full` | 9999px | Pills, avatars |

### Radius Rules

- Surfaces at the same elevation share the same radius
- Interactive elements use one radius size up from their parent surface
- Message bubbles use `radius-2xl` with asymmetric rounding (bl end rounded for user, br end for AI)
- Never combine different radius sizes within a single component

---

## 7. Elevation

| Token | Shadow | Usage |
|-------|--------|-------|
| `elevation-0` | None | Flat surfaces |
| `elevation-1` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| `elevation-2` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards, panels |
| `elevation-3` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Elevated surfaces |
| `elevation-4` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, overlays |
| `elevation-glow` | `0 0 20px rgba(56,189,248,0.15)` | AI active state only |
| `elevation-premium` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(212,175,55,0.2)` | Premium-tier indicators |

### Elevation Rules

- Use elevation sparingly — maximum 2 elevation levels per view
- `elevation-glow` is reserved exclusively for AI streaming/active states
- `elevation-premium` is reserved for premium-tier indicators
- Dark mode uses softer shadows with reduced opacity

---

## 8. Motion

### Duration Tokens

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 100ms | Icon hover, tap feedback |
| `fast` | 200ms | Buttons, chips, toggles |
| `normal` | 350ms | Sidebar transitions, card entrances |
| `slow` | 500ms | Page transitions, modals |
| `verySlow` | 700ms | Hero reveals, large animations |

### Easing Tokens

| Token | Curve | Usage |
|-------|-------|-------|
| `ease-default` | `0.25,0.1,0.25,1` | Standard UI transitions |
| `ease-out` | `0,0,0.2,1` | Entrances |
| `ease-in` | `0.4,0,1,1` | Exits |
| `ease-in-out` | `0.4,0,0.2,1` | Expand/collapse |
| `ease-emphasized` | `0.25,0.46,0.45,0.94` | Cards, featured elements |
| `ease-spring` | Custom spring | Organic motion |
| `ease-linear` | `linear` | Continuous, loading |

### AI-Specific Motion

| AI State | Motion |
|----------|--------|
| Thinking | Subtle pulse on cursor (2s cycle, opacity 0.4→1.0) |
| Streaming | Text reveals line-by-line with 30ms stagger |
| Reasoning | Slow color shift on accent border (2s cycle) |
| Using Tool | Tool icon spins gently (1s rotation) |
| Using Knowledge | Cards slide in from right with 50ms stagger |
| Using Persona | Persona avatar glows (ring expand + fade, 500ms) |
| Using Tone | Tone chip expands slightly (scale 1.0→1.05, 200ms) |
| Finished | Brief glow pulse (300ms) then settle |
| Cancelled | Fade out with scale down (200ms) |
| Regenerated | Old content fades out (200ms), new content fades in (300ms) |
| Comparing | Side-by-side with smooth slider transition |
| Tone Change | Accent color crossfades (400ms ease) |

### Motion Rules

1. Every animation must have a purpose — communicate state, not decorate
2. Respect `prefers-reduced-motion` — disable all non-essential motion
3. Maximum one loading indicator per view at any time
4. Exit animations always pair with entrance animations
5. Stagger children ≤ 0.05s per item
6. Hover scale ≤ 1.03 for controls, ≤ 1.01 for cards
7. Never animate layout-affecting properties (height, width, top, left) — use `transform` and `opacity` only

---

## 9. Icons

### Icon Library

- Primary: `lucide-react` (stroke-based, consistent weight)
- Brand marks: Custom `social-icons.tsx` for LinkedIn, Twitter, etc.
- AI-specific: Custom icons for thinking, streaming, reasoning states

### Icon Sizes

| Size | Usage |
|------|-------|
| 16px (`w-4 h-4`) | Inline icons in buttons, labels |
| 20px (`w-5 h-5`) | Navigation icons, list items |
| 24px (`w-6 h-6`) | Section icons, empty states |
| 32px (`w-8 h-8`) | Feature icons, hero elements |
| 48px (`w-12 h-12`) | Empty state illustrations |

### Icon Rules

- Icon-only controls must have `aria-label`
- Never mix stroke weights within a single surface
- Icons in navigation are 20px with text labels
- Active state icons use the tone accent color

---

## 10. AI Interaction

### AI States and Their Visual Behavior

| State | Visual Indicator | Animation |
|-------|-----------------|-----------|
| **Idle** | No indicator | None |
| **Thinking** | Cursor glows with tone accent | Subtle pulse (opacity 0.3→1.0, 2s cycle) |
| **Streaming** | Animated underline on message bubble | Width expand from 0→100% (per message) |
| **Reasoning** | Accent border shifts hue slowly | Color cycle through tone palette (3s cycle) |
| **Using Tool** | Tool icon spins gently | Rotation 0→360° (1s) |
| **Using Knowledge** | Knowledge cards slide in sequentially | Stagger 100ms per card |
| **Using Persona** | Persona avatar glows | Ring expand + fade (500ms) |
| **Using Tone** | Tone chip expands slightly | Scale 1.0→1.05 (200ms) |
| **Finished** | Brief glow pulse on last message | Scale 1.0→1.02→1.0 (400ms) |
| **Cancelled** | Message fades with reduced opacity | Opacity 1.0→0.5 (300ms) |
| **Regenerated** | Old content fades, new content appears | Fade out 200ms, fade in 300ms |
| **Comparing** | Side-by-side with divider | Divider slides smoothly |

### AI Response Card

- Background: `semantic-surface` with subtle tone accent border-left (4px)
- Streaming: Border-left color matches current tone accent, opacity 0.6
- Finished: Border-left at full opacity, subtle `elevation-2` shadow
- Error: Border-left becomes `semantic-error`, message shows retry button

### AI Thinking Indicator

- Position: Inline at cursor position in composer
- Shape: 3 dots in a horizontal row
- Animation: Sequential pulse (dot1→dot2→dot3→dot1)
- Color: Current tone accent color
- Size: 6px diameter per dot, 12px gap between dots

---

## 11. Components

### Component Tiers

| Tier | Location | Purpose | Examples |
|------|----------|---------|----------|
| **Primitives** | `src/components/ui/*` | Base building blocks from Radix/shadcn | Button, Input, Dialog, Dropdown |
| **Recipes** | `src/components/ui/recipes/*` | Composed surfaces using design tokens | PremiumCard, PremiumPanel, PremiumBadge |
| **Feature Components** | `src/components/workspace/*`, `src/components/chat/*`, etc. | Product-specific components | Composer, MessageCard, TonePicker |
| **Signature Components** | `src/components/signature/*` | Unique ToneCraft components | VoiceOrb, ToneWheel, KnowledgeGalaxy |

### Component Rules

1. All components use primitives and recipes — never hand-roll from scratch
2. Colors from tokens/utilities only — no raw hex in components
3. Spacing on the 4px grid
4. Touch targets ≥ 44px
5. All interactive elements have `focus-visible` states
6. Reduced-motion variants for all animations
7. Components are theme-aware via semantic tokens
8. No component renders content from another section (ownership boundaries)

### Component Inventory

| Component | Purpose | States |
|-----------|---------|---------|
| `GlobalRail` | Navigation hub | Default, active, collapsed |
| `SectionHeader` | Context display | Default, dense, compact |
| `ToneChip` | Voice indicator | Default, hover, active |
| `KnowledgeAttach` | Reference attachment | Default, loading, error |
| `PremiumBadge` | Feature tier indicator | Default, premium, limited |
| `CommandPalette` | Navigation accelerator | Open, active, closed |
| `ToolGrid` | Capability catalog | Default, search, filters |
| `LibraryTabs` | Asset organization | Prompts, Tones, Knowledge |
| `SearchScopes` | Global retrieval | All, Conversations, Messages, Prompts, Tones, Knowledge |
| `ToolPanel` | Inline tool execution | Default, full-screen |
| `ContextDrawer` | Knowledge/panel integration | Default, open, closed |
| `SearchOverlay` | Full-text retrieval | All / Conversations / Messages / Prompts / Tones / Knowledge |
| `NotificationPanel` | Real-time notifications | Unread_count, notifications |

### Signature Components

- **VoiceOrb** — Circular indicator showing the active voice/persona with ambient glow matching the tone color
- **ToneWheel** — Radial selector for choosing writing tones with smooth color transitions
- **KnowledgeGalaxy** — Visual representation of attached knowledge documents as floating nodes
- **AIThinkingRibbon** — Animated ribbon below the composer showing AI processing state
- **PromptDNA** — Visual map showing how a prompt evolved through iterations
- **PersonaCard** — Rich card showing persona details with voice preview capability
- **ConversationTree** — Visual representation of conversation branching and context
- **EmotionSlider** — Slider that maps emotional intensity to visual feedback
- **GenerationTimeline** — Visual timeline showing the AI generation process step by step

---

## 12. Layout

### Global Layout

```
┌─────────────────────────────────────────────────────┐
│ GLOBAL RAIL (5 items, persistent)                   │
├──────────┬──────────────────────────────────────────┤
│          │  SECTION HEADER (breadcrumb + actions)   │
│  RAIL    ├──────────────────────────────────────────┤
│          │                                          │
│ Compose  │  SECTION CONTENT                         │
│ Tools    │                                          │
│ Library  │                                          │
│ Search   │                                          │
│ Account  │                                          │
│          │                                          │
│ ⌘K ⌘N   │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Workspace Modes

| Mode | Sidebar | Context | Content Width | Use Case |
|------|---------|---------|---------------|----------|
| **Standard** | Visible | Drawer available | Full width | Default working mode |
| **Focus** | Hidden | Hidden | Max-w-3xl centered | Deep writing |
| **Writer** | Hidden | Hidden | Max-w-2xl centered, minimal chrome | Long-form writing |

### Layout Rules

- Rail is always visible on desktop (≥1024px)
- On mobile (<768px), rail collapses to bottom tab bar
- Conversation sidebar is a drawer on mobile
- Context panel is always a drawer/overlay, never a permanent pane
- Maximum content width: 1280px centered
- Sidebar: 280px desktop, 0 (drawer) mobile
- Context drawer: 320px desktop, full-width sheet mobile
- Mobile-first: design for smallest screen first, enhance for larger
- Touch targets ≥ 44px on all screen sizes
- Text scales fluidly between breakpoints
- Images and media use `max-w-full` and appropriate aspect ratios
- Never hide critical functionality on mobile — adapt the layout

### Mobile Behavior

- Rail → Bottom tab bar (5 items, icons + labels)
- Conversation sidebar → Slide-over drawer
- Context panel → Bottom sheet
- Composer → Full-width at bottom
- Command palette → Full-width overlay
- Search → Full-width overlay
- Cards → Single column
- Navigation → Hamburger menu in top bar

### Chat UX Rules

#### Message Bubbles

- **User messages**: `semantic-primary` background, `semantic-primary-foreground` text, `radius-2xl` with `rounded-br-sm`
- **AI messages**: `semantic-surface` background, `semantic-text` color, `radius-2xl` with `rounded-bl-sm`, `elevation-2`
- **Streaming**: Slightly transparent background (`bg-card/80`), animated underline
- **Error**: `semantic-error` border-left, retry button inline
- Messages stack vertically with `space-y-4` (16px) gap
- Timestamps in `caption` size, `semantic-muted` color
- Group consecutive messages from same sender with reduced spacing
- First message in a group has full spacing above

#### Composer

- Minimum height: 44px (`min-h-[44px]`)
- Maximum height: 240px (`max-h-[240px]`)
- Border: `border-border/40`, focus ring `ring-2 ring-primary/30`
- Background: `semantic-surface`
- Tone bar: Inline above composer, shows current tone with color indicator

#### Inline Actions

- Copy, Regenerate — visible on hover/focus
- Touch targets ≥ 44px
- Icons at 20px with `aria-label`

### Command Palette

- Trigger: `⌘K` (desktop), dedicated button (mobile)
- Width: 640px max on desktop, full-width on mobile
- Height: 480px max, centered vertically
- Background: `semantic-surface` with `backdrop-blur-xl`
- Border: `border-border/40`
- Shadow: `elevation-4`
- Sections: Navigation (rail items), Actions (common tasks), Search (recent conversations)
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close
- Focus trap when open

### Search Overlay

- Trigger: `⌘⇧S` or `/search` navigation
- Width: 720px max on desktop
- Scopes: All, Conversations, Messages, Prompts, Tones, Knowledge
- Results: Deep-link to exact asset
- Message results: Scroll conversation to match
- Background: `semantic-bg` with 80% opacity overlay
- Border: `border-border/40`
- Shadow: `elevation-4`

### Dashboard

- **Metric Cards**: Use `elevation-2` with `radius-lg`, `space-6` padding
- **Grid Layout**: 3-column on desktop (≥1024px), 2-column on tablet, 1-column on mobile
- **Key Metrics**: Display at the top with large display typography (`display` or `h1`)
- **Charts**: Use `semantic-surface` background with `elevation-1`
- **Quick Actions**: Prominent CTA button with brand gradient
- **Status Indicators**: Use semantic colors (success/warning/error)

### Landing Page

- **Hero**: Full-viewport with artistic canvas background, animated cursor writing, words morphing
- **Value Proposition**: Clear headline + subheadline in `display` and `body-lg`
- **Interactive Demo**: Embedded playground showing tone transformation in real-time
- **Social Proof**: Testimonials with avatar cards using `elevation-2`
- **Pricing**: Card-based layout with `elevation-3` for featured plan
- **CTA**: Primary gradient button (`bg-gradient-to-r from-violet-600 to-indigo-600`) with `elevation-glow`
- **Mobile**: Single column, hero text stacks, CTA prominent above fold

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Command palette |
| `⌘N` | New chat |
| `⌘1` | Navigate to Compose |
| `⌘2` | Navigate to Tools |
| `⌘3` | Navigate to Library |
| `⌘4` | Navigate to Search |
| `⌘B` | Toggle conversation sidebar |
| `⌘\` | Toggle context drawer |
| `⌘⇧S` | Open search |
| `Escape` | Close overlay / drawer / panel |
| `⌘/` | Show keyboard shortcuts help |

---

## 13. Themes

### Dark Theme Tokens

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `base-bg` | `#F8FAFC` | `#0B0F1A` |
| `base-surface` | `#FFFFFF` | `#111827` |
| `base-elevated` | `#F1F5F9` | `#1E293B` |
| `base-border` | `#E2E8F0` | `#1E3A5F` |
| `base-text` | `#0F172A` | `#F1F5F9` |
| `base-muted` | `#64748B` | `#94A3B8` |

### Dark Theme Rules

- Background is deep navy (`#0B0F1A`) — not pure black
- Surfaces are slightly lighter than background (`#111827`)
- Elevated surfaces use blue-tinted borders (`#1E3A5F`)
- Shadows are softer in dark mode (reduced opacity)
- Tone accent colors remain vivid — they pop against dark backgrounds
- Glass effects use higher opacity in dark mode for readability

### Light Theme Tokens

| Token | Value |
|-------|-------|
| `base-bg` | `#F8FAFC` |
| `base-surface` | `#FFFFFF` |
| `base-elevated` | `#F1F5F9` |
| `base-border` | `#E2E8F0` |
| `base-text` | `#0F172A` |
| `base-muted` | `#64748B` |

### Light Theme Rules

- Clean white backgrounds with subtle gray surfaces
- Borders are visible but not heavy
- Shadows are more pronounced in light mode for depth
- Tone accent colors are slightly desaturated for readability
- Glass effects use lower opacity in light mode

### Glass Effects (Use Sparingly)

Glass effects are reserved for:

- Command palette background
- Context drawer backdrop
- Premium badge surfaces
- Navigation rail on elevated surfaces

#### Glass Rules

- Background: `bg-card/40` to `bg-card/60`
- Backdrop blur: `backdrop-blur-xl`
- Border: `border-white/10` (light) or `border-white/5` (dark)
- Never use glass on primary content surfaces — it reduces readability
- Minimum contrast ratio 4.5:1 for text on glass surfaces

### Gradients

#### Brand Gradient

```
bg-gradient-to-r from-violet-600 to-indigo-600
```

Used exclusively for primary CTA buttons and premium indicators.

#### Tone Gradients

Each tone has a subtle gradient used for ambient background effects:

- Friendly: `from-emerald-500 to-teal-500`
- Professional: `from-blue-500 to-indigo-500`
- Luxury: `from-amber-500 to-yellow-500`
- Sarcastic: `from-orange-500 to-red-500`
- Poetic: `from-pink-500 to-rose-500`
- Minimal: `from-slate-400 to-gray-500`
- Corporate: `from-indigo-500 to-violet-500`
- Academic: `from-teal-500 to-cyan-500`
- Creative: `from-violet-500 to-purple-500`

#### Gradient Rules

- Gradients are used sparingly — maximum one per view
- Never use gradients for text (except hero headings)
- Gradient buttons use the brand gradient exclusively
- Tone gradients are used as ambient background effects only

### Premium Effects

Premium effects are reserved for premium-tier users. Premium effects must not degrade the experience for free users. Premium indicators must be honest — not misleading. Free users should never feel blocked from core functionality.

- **Premium Surfaces** — `elevation-premium` shadow on premium cards, gold accent border
- **Premium Indicators** — `PremiumBadge` component with crown icon, gold gradient background, used on premium features, locked content, and upgrade prompts

---

## 14. Accessibility

### Touch Targets

- Minimum 44px for all interactive elements
- Icon-only buttons: 44px × 44px minimum
- Links in text: 44px height with adequate padding

### Contrast

- Body text: ≥ 4.5:1 contrast ratio against background
- Large text (≥18px or ≥14px bold): ≥ 3:1 contrast ratio
- `semantic-muted` must maintain ≥ 4.5:1 on its surface
- Never use opacity alone to convey information

### Focus Management

- Visible `focus-visible` ring on all interactive elements
- Focus ring: `ring-2 ring-primary/30` with 2px offset
- Focus trap in modals and dialogs
- Escape key closes all overlays

### Reduced Motion

- All animations respect `prefers-reduced-motion: reduce`
- Use `useReducedMotion` hook from `src/hooks/use-reduced-motion.ts`
- When reduced motion is preferred:
  - Replace all transitions with instant state changes
  - Remove all stagger animations
  - Replace loading spinners with static indicators
  - Remove all entrance/exit animations

### Semantic HTML

- Use real `<button>` elements for actions
- Use `<nav>` for navigation regions
- Use `<main>` for primary content
- Use `aria-label` for icon-only controls
- Use `aria-live` for dynamic content (AI responses, notifications)
- Use `role="status"` for loading states

### Anti-Patterns

- **Modals for simple actions** → Use inline panels or progressive disclosure
- **Overuse of gradients** → Limit to hero sections and primary brand elements
- **Overcrowded UI** → Maximum 3 levels of visual hierarchy
- **Implicit state** → Always show visual cue for state changes
- **Ignoring accessibility** → Contrast ≥ 4.5:1, focus states required
- **Ignoring responsive design** → Drawer pattern for mobile contexts
- **Inconsistent component states** → All components must have consistent state coverage

---

## 15. Technical Implementation

### Token Architecture

- All design values come from `src/styles/tokens.ts`
- Never hardcode values in components
- If a value doesn't exist in the token system, add it to the token system first
- Access via `import { color, spacing, radius, elevation, zIndex } from "@/styles/tokens"`

### CSS Strategy

- Tailwind classes remain source of truth for layout
- Utility-first with design tokens for computed values
- No semantic class names (e.g., `.primary-button`)
- All tokens exported from `src/styles/` as typed constants

### Component Structure

- Components live in `src/components/` by domain
- Feature components in `src/components/workspace/`, `src/components/tools/`
- Shared primitives in `src/components/ui/`
- Signature components in `src/components/signature/`
- All components must pass design token audit

### Accessibility Checklist

- [ ] Touch targets ≥ 44px
- [ ] Contrast ≥ 4.5:1 for body text
- [ ] Focus-visible styles present
- [ ] `aria-label` on icon-only controls
- [ ] Reduced-motion variants wired
- [ ] Semantic HTML elements used correctly
- [ ] No phantom controls (every control does what it says)

---

## 16. Validation

### Loading States

#### Skeleton Loading

- Use `Skeleton` component from `src/components/ui/skeleton`
- Shape matches the content being loaded (text lines, card shapes, etc.)
- Animation: Subtle pulse (opacity 0.4→1.0, 1.5s cycle)
- Never show skeleton for less than 300ms (avoid flash)

#### AI Loading

- **Thinking**: 3-dot pulse indicator in composer area
- **Streaming**: Message bubble appears immediately with animated underline
- **Generating**: Single loading indicator with "Generating..." label

#### Page Loading

- `PageSkeleton` component for full-page loading
- `CardSkeleton` for card grids
- `ListSkeleton` for list views

### Error States

| Component | Behavior |
|-----------|----------|
| **Inline Error** | Red border (`semantic-error`), error text below field in `caption` size |
| **API Error** | Toast notification with error message and retry action |
| **Page Error** | `ErrorFallback` component with retry button and error ID |
| **Stream Error** | Message bubble shows error state with "Retry" and "Regenerate" buttons |

#### Error Rules

- Never show raw error messages to users — use human-readable descriptions
- Always provide a recovery action (retry, dismiss, or navigate)
- Error boundaries catch component-level errors gracefully
- Network errors show offline indicator and queue actions for retry

### Empty States

Every empty state follows this pattern:

1. **Illustration**: Custom icon or illustration at 48px (`w-12 h-12`) in `semantic-muted`
2. **Title**: `h5` size, `semantic-text`
3. **Description**: `body-sm`, `semantic-muted`
4. **Primary Action**: One CTA button, `variant=gradient`
5. **Secondary Action**: Optional text link

#### Empty State Examples

| Context | Title | Action |
|---------|-------|--------|
| No conversations | "Start a conversation" | "New Chat" |
| No prompts saved | "No saved prompts" | "Browse Library" |
| No knowledge attached | "No reference documents" | "Upload a document" |
| No tones customized | "No custom tones" | "Create a tone" |
| No search results | "No results found" | "Try different keywords" |

### Validation Checklist

- [ ] All tokens used in components
- [ ] All components use design tokens
- [ ] All pages use consistent layout principles
- [ ] Mobile views match desktop layout logic
- [ ] Empty states lead to primary action
- [ ] Loading states match component state
- [ ] Error states show clear resolution path
- [ ] Motion respects reduced-motion preferences
- [ ] Brand personality maintained across all screens

---

## 17. Final Principles

1. **Human-Centric AI** — AI should amplify human creativity, not replace it
2. **Precision Over Decoration** — Remove visual noise; keep only meaningful elements
3. **Contextual Intelligence** — UI should adapt to creative workflow, not force workflow changes
4. **Emotional Resonance** — Design should evoke the feeling of effective communication
5. **Discoverability** — Every capability must be findable within 3 seconds
6. **Reversibility** — Allow creative experimentation without fear of mistakes
7. **Progressive Mastery** — Onboard beginners, empower experts, delight power users
8. **Intentional Motion** — Every animation must serve purpose and emotion

---

## Change Control

This document is **frozen**. Changes require:

1. Discovery of a real problem during implementation
2. Proposal with justification
3. Review against the Design DNA statement
4. Approval before modification

Do not modify this document for aesthetic preferences, trends, or convenience. The design system exists to serve the product, not the other way around.

**Next Steps:**

1. Create page-specific design specifications
2. Build component blueprints
3. Prototype user journeys
4. Implement via OpenCode with focused tasks

This design system is now complete and ready for implementation.
