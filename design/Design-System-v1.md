# ToneCraft Design System v1.0 — FROZEN

> **Status:** Frozen — do not modify unless a real problem is discovered during implementation.
> **Version:** 1.0.0
> **Last Updated:** 2026-08-06
> **Artistic Direction:** Editorial Luxury (60%) + Apple (20%) + Arc Browser (10%) + Futuristic Motion (10%)

---

## Design DNA

> **"Every interaction shapes expression. Every pixel serves voice."**

ToneCraft is not a tool. It is a language studio where the interface adapts to the emotional intent of the writer. The design system exists to make the creative process feel effortless, expressive, and deeply personal.

---

## 1. Core Principles

### 1.1 Expressive Precision
Every UI element exists to serve the writer's creative intent. Controls are precise but never clinical. The interface responds to tone selection with subtle visual shifts — color temperature, spacing rhythm, motion weight.

### 1.2 Progressive Revelation
Complexity unfolds only when needed. The default state is clean and focused. Advanced controls appear contextually — tone sliders expand when a persona is selected, knowledge attachments surface when the context drawer opens.

### 1.3 Trust Through Transparency
Every AI action is visually communicated. The user always knows what the AI is doing: thinking, streaming, reasoning, using knowledge, or finished. No phantom states. No ambiguous feedback.

### 1.4 Editorial Quality
Typography, spacing, and visual hierarchy follow editorial standards. Content is the hero. The UI frames writing with the same care a magazine editor applies to a page layout.

### 1.5 Intentional Motion
Motion communicates state, not decoration. Every animation has a purpose: indicating AI processing, transitioning between tones, revealing context, or confirming an action. No ambient loops. No decorative particles.

---

## 2. Color System

### 2.1 Base Palette

| Token | Value | Usage |
|-------|-------|-------|
| `base-bg` | `#0B0F1A` | Deep navy background — the canvas |
| `base-surface` | `#111827` | Primary surface cards |
| `base-elevated` | `#1E293B` | Elevated surfaces, popovers |
| `base-border` | `#1E3A5F` | Subtle borders with blue undertone |
| `base-text` | `#F1F5F9` | Primary text |
| `base-muted` | `#94A3B8` | Secondary text, captions |
| `base-accent` | `#38BDF8` | Sky blue — AI active state |

### 2.2 Tone-Color Mapping

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
| Creative | `#A78BFA` (violet) | Imaginative, bold | Violet ambient glow on canvas |

### 2.3 Semantic Tokens

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

### 2.4 Color Rules
- 85% of the interface uses neutral base tones (navy, slate, gray)
- 10% uses functional semantic colors (success, warning, error, info)
- 5% uses the active tone accent color — this is what makes the UI feel alive
- Never use raw hex values outside of `src/styles/colors.ts`
- Tone accent colors transition smoothly (300ms ease) when the user switches tones

---

## 3. Typography

### 3.1 Type Scale

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
| `micro` | 10px | 1.3 | 500 | Badges, labels (rare) |

### 3.2 Font Families

| Role | Font | Fallback |
|------|------|----------|
| UI Text | Inter | system-ui, sans-serif |
| Content | Inter (same family, different weight) | system-ui, sans-serif |
| Mono | JetBrains Mono | monospace |

### 3.3 Typography Rules
- Headings use `tracking-tight` for editorial quality
- Body text uses `tracking-normal` for readability
- No text below 12px in the UI (captions only)
- Line height minimum 1.4 for all text sizes
- Maximum line length 72 characters for body text
- Use weight for hierarchy, not font family changes

---

## 4. Spacing System

### 4.1 Base Grid (4px)

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

### 4.2 Spacing Rules
- All padding and margin uses multiples of 4px
- Component internal padding: `space-4` (16px) standard, `space-6` (24px) for cards
- Section gaps: `space-8` (32px) between sections, `space-12` (48px) between major sections
- Maximum content width: 1280px centered
- Sidebar width: 280px fixed (desktop), collapsed to 0 with drawer on mobile
- Context drawer width: 320px (desktop), full-width sheet on mobile

---

## 5. Radius System

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

## 6. Elevation & Shadows

| Token | Shadow | Usage |
|-------|--------|-------|
| `elevation-0` | None | Flat surfaces |
| `elevation-1` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| `elevation-2` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Cards, panels |
| `elevation-3` | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` | Elevated surfaces |
| `elevation-4` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | Modals, overlays |
| `elevation-glow` | `0 0 20px rgba(56,189,248,0.15)` | AI active state only |
| `elevation-premium` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(212,175,55,0.2)` | Premium/locked surfaces |

### Elevation Rules
- Use elevation sparingly — maximum 2 elevation levels per view
- `elevation-glow` is reserved exclusively for AI streaming/active states
- `elevation-premium` is reserved for premium-tier indicators
- Dark mode uses softer shadows with reduced opacity

---

## 7. Iconography

### 7.1 Icon Library
- Primary: `lucide-react` (stroke-based, consistent weight)
- Brand marks: Custom `social-icons.tsx` for LinkedIn, Twitter, etc.
- AI-specific: Custom icons for thinking, streaming, reasoning states

### 7.2 Icon Sizes
| Size | Usage |
|------|-------|
| 16px (`w-4 h-4`) | Inline icons in buttons, labels |
| 20px (`w-5 h-5`) | Navigation icons, list items |
| 24px (`w-6 h-6`) | Section icons, empty states |
| 32px (`w-8 h-8`) | Feature icons, hero elements |
| 48px (`w-12 h-12`) | Empty state illustrations |

### 7.3 Icon Rules
- Icon-only controls must have `aria-label`
- Never mix stroke weights within a single surface
- Icons in navigation are 20px with text labels
- Active state icons use the tone accent color

---

## 8. Motion Language

### 8.1 Duration Tokens

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 100ms | Icon hover, tap feedback |
| `fast` | 200ms | Buttons, chips, toggles |
| `normal` | 350ms | Sidebar transitions, card entrances |
| `slow` | 500ms | Page transitions, modals |
| `verySlow` | 700ms | Hero reveals, large animations |

### 8.2 Easing Tokens

| Token | Curve | Usage |
|-------|-------|-------|
| `ease-default` | `0.25,0.1,0.25,1` | Standard UI transitions |
| `ease-out` | `0,0,0.2,1` | Entrances |
| `ease-in` | `0.4,0,1,1` | Exits |
| `ease-in-out` | `0.4,0,0.2,1` | Expand/collapse |
| `ease-emphasized` | `0.25,0.46,0.45,0.94` | Cards, featured elements |
| `ease-spring` | Custom spring | Organic motion |
| `ease-linear` | `linear` | Continuous, loading |

### 8.3 AI-Specific Motion

| AI State | Motion |
|----------|--------|
| Thinking | Subtle pulse on cursor (2s cycle, opacity 0.4→1.0) |
| Streaming | Text reveals line-by-line with 30ms stagger |
| Reasoning | Slow color shift on accent border (2s cycle) |
| Using Knowledge | Cards slide in from right with 50ms stagger |
| Finished | Brief glow pulse (300ms) then settle |
| Cancelled | Fade out with scale down (200ms) |
| Regenerated | Old content fades out (200ms), new content fades in (300ms) |
| Comparing | Side-by-side with smooth slider transition |
| Tone Change | Accent color crossfades (400ms ease) |

### 8.4 Motion Rules
1. Every animation must have a purpose — communicate state, not decorate
2. Respect `prefers-reduced-motion` — disable all non-essential motion
3. Maximum one loading indicator per view at any time
4. Exit animations always pair with entrance animations
5. Stagger children ≤ 0.05s per item
6. Hover scale ≤ 1.03 for controls, ≤ 1.01 for cards
7. Never animate layout-affecting properties (height, width, top, left) — use `transform` and `opacity` only

---

## 9. AI Visual Language

### 9.1 AI States and Their Visual Behavior

| State | Visual Indicator | Animation | Duration |
|-------|-----------------|-----------|----------|
| **Idle** | No indicator | None | — |
| **Thinking** | Cursor glows with tone accent | Subtle pulse (opacity 0.3→1.0) | 2s cycle |
| **Streaming** | Animated underline on message bubble | Width expand from 0→100% | Per message |
| **Reasoning** | Accent border shifts hue slowly | Color cycle through tone palette | 3s cycle |
| **Using Tool** | Tool icon spins gently | Rotation 0→360° | 1s |
| **Using Knowledge** | Knowledge dots illuminate sequentially | Opacity 0→1, stagger 100ms | Per dot |
| **Using Persona** | Persona avatar glows | Ring expand + fade | 500ms |
| **Using Tone** | Tone chip expands slightly | Scale 1.0→1.05 | 200ms |
| **Finished** | Brief glow pulse on last message | Scale 1.0→1.02→1.0 | 400ms |
| **Cancelled** | Message fades with reduced opacity | Opacity 1.0→0.5 | 300ms |
| **Regenerated** | Old content fades, new content appears | Fade out 200ms, fade in 300ms | 500ms total |
| **Comparing** | Side-by-side with divider | Divider slides smoothly | — |

### 9.2 AI Response Card
- Background: `semantic-surface` with subtle tone accent border-left (4px)
- Streaming: Border-left color matches current tone accent, opacity 0.6
- Finished: Border-left at full opacity, subtle `elevation-2` shadow
- Error: Border-left becomes `semantic-error`, message shows retry button

### 9.3 AI Thinking Indicator
- Position: Inline at cursor position in composer
- Shape: 3 dots in a horizontal row
- Animation: Sequential pulse (dot1→dot2→dot3→dot1)
- Color: Current tone accent color
- Size: 6px diameter per dot, 12px gap between dots

---

## 10. Component Philosophy

### 10.1 Component Tiers

| Tier | Location | Purpose | Examples |
|------|----------|---------|----------|
| **Primitives** | `src/components/ui/*` | Base building blocks from Radix/shadcn | Button, Input, Dialog, Dropdown |
| **Recipes** | `src/components/ui/recipes/*` | Composed surfaces using design tokens | PremiumCard, PremiumPanel, PremiumBadge |
| **Feature Components** | `src/components/workspace/*`, `src/components/chat/*`, etc. | Product-specific components | Composer, MessageCard, TonePicker |
| **Signature Components** | `src/components/signature/*` | Unique ToneCraft components | VoiceOrb, ToneWheel, KnowledgeGalaxy |

### 10.2 Component Rules
1. All components use primitives and recipes — never hand-roll from scratch
2. Colors from tokens/utilities only — no raw hex in components
3. Spacing on the 4px grid
4. Touch targets ≥ 44px
5. All interactive elements have `focus-visible` states
6. Reduced-motion variants for all animations
7. Components are theme-aware via semantic tokens
8. No component renders content from another section (ownership boundaries)

### 10.3 Signature Components (ToneCraft Unique)

These components define ToneCraft's visual identity and should be designed with special care:

- **VoiceOrb** — Circular indicator showing the active voice/persona with ambient glow matching the tone color
- **ToneWheel** — Radial selector for choosing writing tones with smooth color transitions
- **KnowledgeGalaxy** — Visual representation of attached knowledge documents as floating nodes
- **AIThinkingRibbon** — Animated ribbon below the composer showing AI processing state
- **PromptDNA** — Visual map showing how a prompt evolved through iterations
- **ResponseDiffViewer** — Side-by-side comparison with morphing animation between versions
- **PersonaCard** — Rich card showing persona details with voice preview capability
- **ConversationTree** — Visual representation of conversation branching and context
- **EmotionSlider** — Slider that maps emotional intensity to visual feedback
- **GenerationTimeline** — Visual timeline showing the AI generation process step by step

---

## 11. Layout Principles

### 11.1 Global Layout

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

### 11.2 Compose Workspace (Three-Pane → Two-Pane + Drawer)

```
┌─────────────────────────────────────────────────────┐
│ Section Header (conversation title + actions)       │
├────────────────────┬───────────────────────────────┤
│                    │                               │
│  Conversation      │  Thread + Composer            │
│  Sidebar           │  [Tone Bar] [Input] [Send]    │
│  (Pinned, Recent,  │                               │
│   Favorites, etc.) │                               │
│                    ├───────────────────────────────┤
│                    │  Context Drawer (overlay)      │
│                    │  (tone, model, knowledge)      │
└────────────────────┴───────────────────────────────┘
```

### 11.3 Workspace Modes

| Mode | Sidebar | Context | Content Width | Use Case |
|------|---------|---------|---------------|----------|
| **Standard** | Visible | Drawer available | Full width | Default working mode |
| **Focus** | Hidden | Hidden | Max-w-3xl centered | Deep writing |
| **Writer** | Hidden | Hidden | Max-w-2xl centered, minimal chrome | Long-form writing |

### 11.4 Layout Rules
- Rail is always visible on desktop (≥1024px)
- On mobile (<768px), rail collapses to bottom tab bar
- Conversation sidebar is a drawer on mobile
- Context panel is always a drawer/overlay, never a permanent pane
- Maximum content width: 1280px centered
- Sidebar: 280px desktop, 0 (drawer) mobile
- Context drawer: 320px desktop, full-width sheet mobile

---

## 12. Dashboard Principles

- **Metric Cards**: Use `elevation-2` with `radius-lg`, `space-6` padding
- **Grid Layout**: 3-column on desktop (≥1024px), 2-column on tablet, 1-column on mobile
- **Key Metrics**: Display at the top with large display typography (`display` or `h1`)
- **Charts**: Use `semantic-surface` background with `elevation-1`
- **Quick Actions**: Prominent CTA button with brand gradient
- **Status Indicators**: Use semantic colors (success/warning/error)

---

## 13. Landing Page Principles

- **Hero**: Full-viewport with artistic canvas background, animated cursor writing, words morphing
- **Value Proposition**: Clear headline + subheadline in `display` and `body-lg`
- **Interactive Demo**: Embedded playground showing tone transformation in real-time
- **Social Proof**: Testimonials with avatar cards using `elevation-2`
- **Pricing**: Card-based layout with `elevation-3` for featured plan
- **CTA**: Primary gradient button (`bg-gradient-to-r from-violet-600 to-indigo-600`) with `elevation-glow`
- **Mobile**: Single column, hero text stacks, CTA prominent above fold

---

## 14. Chat UX Rules

### 14.1 Message Bubbles
- **User messages**: `semantic-primary` background, `semantic-primary-foreground` text, `radius-2xl` with `rounded-br-sm`
- **AI messages**: `semantic-surface` background, `semantic-text` color, `radius-2xl` with `rounded-bl-sm`, `elevation-2`
- **Streaming**: Slightly transparent background (`bg-card/80`), animated underline
- **Error**: `semantic-error` border-left, retry button inline

### 14.2 Composer
- Minimum height: 44px (`min-h-[44px]`)
- Maximum height: 240px (`max-h-[240px]`)
- Border: `border-border/40`, focus ring `ring-2 ring-primary/30`
- Background: `semantic-surface`
- Tone bar: Inline above composer, shows current tone with color indicator

### 14.3 Inline Actions
- Copy, Regenerate, Tone Again — visible on hover/focus
- Touch targets ≥ 44px
- Icons at 20px with `aria-label`

### 14.4 Chat Layout Rules
- Messages stack vertically with `space-y-4` (16px) gap
- Timestamps in `caption` size, `semantic-muted` color
- Group consecutive messages from same sender with reduced spacing
- First message in a group has full spacing above

---

## 15. Command Palette Rules

- Trigger: `⌘K` (desktop), dedicated button (mobile)
- Width: 640px max on desktop, full-width on mobile
- Height: 480px max, centered vertically
- Background: `semantic-surface` with `backdrop-blur-xl`
- Border: `border-border/40`
- Shadow: `elevation-4`
- Sections: Navigation (rail items), Actions (common tasks), Search (recent conversations)
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close
- Focus trap when open

---

## 16. Search Overlay Rules

- Trigger: `⌘⇧S` or `/search` navigation
- Width: 720px max on desktop
- Scopes: All, Conversations, Messages, Prompts, Tones, Knowledge
- Results: Deep-link to exact asset
- Message results: Scroll conversation to match
- Background: `semantic-bg` with 80% opacity overlay
- Border: `border-border/40`
- Shadow: `elevation-4`

---

## 17. Empty States

Every empty state follows this pattern:
1. **Illustration**: Custom icon or illustration at 48px (`w-12 h-12`) in `semantic-muted`
2. **Title**: `h5` size, `semantic-text`
3. **Description**: `body-sm`, `semantic-muted`
4. **Primary Action**: One CTA button, `variant=gradient`
5. **Secondary Action**: Optional text link

### Empty State Examples
| Context | Title | Action |
|---------|-------|--------|
| No conversations | "Start a conversation" | "New Chat" |
| No prompts saved | "No saved prompts" | "Browse Library" |
| No knowledge attached | "No reference documents" | "Upload a document" |
| No tones customized | "No custom tones" | "Create a tone" |
| No search results | "No results found" | "Try different keywords" |

---

## 18. Loading States

### 18.1 Skeleton Loading
- Use `Skeleton` component from `src/components/ui/skeleton`
- Shape matches the content being loaded (text lines, card shapes, etc.)
- Animation: Subtle pulse (opacity 0.4→1.0, 1.5s cycle)
- Never show skeleton for less than 300ms (avoid flash)

### 18.2 AI Loading
- **Thinking**: 3-dot pulse indicator in composer area
- **Streaming**: Message bubble appears immediately with animated underline
- **Generating**: Single `loading.spin` spinner with "Generating..." label

### 18.3 Page Loading
- `PageSkeleton` component for full-page loading
- `CardSkeleton` for card grids
- `ListSkeleton` for list views

---

## 19. Error States

| Component | Behavior |
|-----------|----------|
| **Inline Error** | Red border (`semantic-error`), error text below field in `caption` size |
| **API Error** | Toast notification with error message and retry action |
| **Page Error** | `ErrorFallback` component with retry button and error ID |
| **Stream Error** | Message bubble shows error state with "Retry" and "Regenerate" buttons |
| **Empty State** | Shown when no data exists (see Empty States section) |

### Error Rules
- Never show raw error messages to users — use human-readable descriptions
- Always provide a recovery action (retry, dismiss, or navigate)
- Error boundaries catch component-level errors gracefully
- Network errors show offline indicator and queue actions for retry

---

## 20. Accessibility

### 20.1 Touch Targets
- Minimum 44px for all interactive elements
- Icon-only buttons: 44px × 44px minimum
- Links in text: 44px height with adequate padding

### 20.2 Contrast
- Body text: ≥ 4.5:1 contrast ratio against background
- Large text (≥18px or ≥14px bold): ≥ 3:1 contrast ratio
- `semantic-muted` must maintain ≥ 4.5:1 on its surface
- Never use opacity alone to convey information

### 20.3 Focus Management
- Visible `focus-visible` ring on all interactive elements
- Focus ring: `ring-2 ring-primary/30` with 2px offset
- Focus trap in modals and dialogs
- Escape key closes all overlays

### 20.4 Reduced Motion
- All animations respect `prefers-reduced-motion: reduce`
- Use `useReducedMotion` hook from `src/hooks/use-reduced-motion.ts`
- When reduced motion is preferred:
  - Replace all transitions with instant state changes
  - Remove all stagger animations
  - Replace loading spinners with static indicators
  - Remove all entrance/exit animations

### 20.5 Semantic HTML
- Use real `<button>` elements for actions
- Use `<nav>` for navigation regions
- Use `<main>` for primary content
- Use `aria-label` for icon-only controls
- Use `aria-live` for dynamic content (AI responses, notifications)
- Use `role="status"` for loading states

---

## 21. Responsive Strategy

### 21.1 Breakpoints

| Breakpoint | Min Width | Behavior |
|------------|-----------|----------|
| `sm` | 640px | Two-column cards |
| `md` | 768px | Dashboard chrome adapts, sidebar becomes drawer |
| `lg` | 1024px | Full desktop layout, rail visible |
| `xl` | 1280px | Container cap at 1280px |
| `2xl` | 1400px | Maximum content width |

### 21.2 Mobile Behavior
- Rail → Bottom tab bar (5 items, icons + labels)
- Conversation sidebar → Slide-over drawer
- Context panel → Bottom sheet
- Composer → Full-width at bottom
- Command palette → Full-width overlay
- Search → Full-width overlay
- Cards → Single column
- Navigation → Hamburger menu in top bar

### 21.3 Responsive Rules
- Mobile-first: design for smallest screen first, enhance for larger
- Touch targets ≥ 44px on all screen sizes
- Text scales fluidly between breakpoints
- Images and media use `max-w-full` and appropriate aspect ratios
- Never hide critical functionality on mobile — adapt the layout

---

## 22. Dark Theme

### 22.1 Dark Theme Tokens

| Token | Light Value | Dark Value |
|-------|-------------|------------|
| `base-bg` | `#F8FAFC` | `#0B0F1A` |
| `base-surface` | `#FFFFFF` | `#111827` |
| `base-elevated` | `#F1F5F9` | `#1E293B` |
| `base-border` | `#E2E8F0` | `#1E3A5F` |
| `base-text` | `#0F172A` | `#F1F5F9` |
| `base-muted` | `#64748B` | `#94A3B8` |

### 22.2 Dark Theme Rules
- Background is deep navy (`#0B0F1A`) — not pure black
- Surfaces are slightly lighter than background (`#111827`)
- Elevated surfaces use blue-tinted borders (`#1E3A5F`)
- Shadows are softer in dark mode (reduced opacity)
- Tone accent colors remain vivid — they pop against dark backgrounds
- Glass effects use higher opacity in dark mode for readability

---

## 23. Light Theme

### 23.1 Light Theme Tokens

| Token | Value |
|-------|-------|
| `base-bg` | `#F8FAFC` |
| `base-surface` | `#FFFFFF` |
| `base-elevated` | `#F1F5F9` |
| `base-border` | `#E2E8F0` |
| `base-text` | `#0F172A` |
| `base-muted` | `#64748B` |

### 23.2 Light Theme Rules
- Clean white backgrounds with subtle gray surfaces
- Borders are visible but not heavy
- Shadows are more pronounced in light mode for depth
- Tone accent colors are slightly desaturated for readability
- Glass effects use lower opacity in light mode

---

## 24. Glass Effects (Use Sparingly)

Glass effects are reserved for:
- Command palette background
- Context drawer backdrop
- Premium badge surfaces
- Navigation rail on elevated surfaces

### Glass Rules
- Background: `bg-card/40` to `bg-card/60`
- Backdrop blur: `backdrop-blur-xl`
- Border: `border-white/10` (light) or `border-white/5` (dark)
- Never use glass on primary content surfaces — it reduces readability
- Minimum contrast ratio 4.5:1 for text on glass surfaces

---

## 25. Gradients

### 25.1 Brand Gradient
```
bg-gradient-to-r from-violet-600 to-indigo-600
```
Used exclusively for primary CTA buttons and premium indicators.

### 25.2 Tone Gradients
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

### 25.3 Gradient Rules
- Gradients are used sparingly — maximum one per view
- Never use gradients for text (except hero headings)
- Gradient buttons use the brand gradient exclusively
- Tone gradients are used as ambient background effects only

---

## 26. Visual Hierarchy

### 26.1 Size Hierarchy
```
Display (56px) → H1 (40px) → H2 (32px) → H3 (24px) → H4 (20px) → H5 (16px) → Body (16px) → Body-Sm (14px) → Caption (12px)
```

### 26.2 Weight Hierarchy
```
Bold (700) for headings → Semibold (600) for labels → Medium (500) for body → Regular (400) for secondary text
```

### 26.3 Color Priority
```
Primary accent (tone color) → Semantic colors (success/warning/error/info) → Primary text → Muted text → Border
```

### 26.4 Spatial Hierarchy
```
Large whitespace → Card grouping → Internal padding → Inline spacing → Tight grouping
```

---

## 27. Onboarding Flow

### 27.1 First Visit (Unauthenticated)
1. Landing page with hero and interactive demo
2. "Get Started" CTA → Sign up page
3. After sign-up → Onboarding (3 steps)

### 27.2 Onboarding (3 Steps)
1. **Writing Type**: Select your primary writing purpose (blog, email, social, academic, creative)
2. **Language**: Choose your primary language (pre-fills composer defaults)
3. **Default Tone**: Pick your default writing tone (pre-seeds the tone bar)

### 27.3 Onboarding Rules
- Optional — always provide a "Skip" option
- After onboarding → Navigate directly to Compose
- Rail is visible from the first authenticated screen
- Onboarding outputs seed the composer defaults
- No more than 3 steps — keep it brief

---

## 28. Premium Effects

Premium effects are reserved for premium-tier users and should never be used for basic functionality.

### 28.1 Premium Cursor
- Exclusive interactive cursor for premium users
- Subtle trail effect following mouse movement
- Respects `prefers-reduced-motion`

### 28.2 Premium Surfaces
- `elevation-premium` shadow on premium cards
- Gold accent border (`border-primary/20` with gold tone)
- Subtle shimmer animation on hover (2s cycle)

### 28.3 Premium Indicators
- `PremiumBadge` component with crown icon
- Gold gradient background
- Used on premium features, locked content, and upgrade prompts

### 28.4 Premium Rules
- Premium effects must not degrade the experience for free users
- Premium indicators must be honest — not misleading
- Free users should never feel blocked from core functionality

---

## 29. Keyboard Shortcuts

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

## 30. Implementation Rules

### 30.1 Token Usage
- All design values come from `src/styles/tokens.ts`
- Never hardcode values in components
- If a value doesn't exist in the token system, add it to the token system first

### 30.2 Component Usage
- Use primitives from `src/components/ui/*` for base elements
- Use recipes from `src/components/ui/recipes/*` for composed surfaces
- Use feature components from domain-specific folders for product UI
- Use signature components from `src/components/signature/*` for unique ToneCraft elements

### 30.3 Color Usage
- Use semantic tokens (`bg-card`, `text-foreground`, etc.) for theme-aware surfaces
- Use `color.*` constants for tone-specific and platform colors
- Never use raw hex values in components

### 30.4 Motion Usage
- Use motion presets from `src/styles/motion.ts`
- Never use inline animation values
- All motion must respect `prefers-reduced-motion`

### 30.5 Responsive Usage
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Mobile-first: base styles are mobile, enhance with larger breakpoints
- Test all components at all breakpoints

### 30.6 Accessibility Checklist
- [ ] Touch targets ≥ 44px
- [ ] Contrast ≥ 4.5:1 for body text
- [ ] Focus-visible styles present
- [ ] `aria-label` on icon-only controls
- [ ] Reduced-motion variants wired
- [ ] Semantic HTML elements used correctly
- [ ] No phantom controls (every control does what it says)

---

## 31. Change Control

This document is **frozen**. Changes require:
1. Discovery of a real problem during implementation
2. Proposal with justification
3. Review against the Design DNA statement
4. Approval before modification

Do not modify this document for aesthetic preferences, trends, or convenience. The design system exists to serve the product, not the other way around.