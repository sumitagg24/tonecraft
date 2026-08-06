# Design-System-v1.md

> **Status:** Frozen — do not modify unless a real problem is discovered during implementation
> **Version:** 1.0.0
> **Last Updated:** 2026-08-06
> **Architectural Note:** This is the foundational design system document. All components and pages must conform to this specification.

---

## Design System Foundation

### 1. Design DNA
> **"Every interaction shapes expression. Every pixel serves voice."**

ToneCraft is not software - it's a language studio where AI enhances human creativity. The design system exists to make the creative process feel natural, expressive, and emotionally resonant.

### 2. Design Philosophy
- **Progressive disclosure**: Reveal complexity only when needed
- **Contextual intelligence**: UI adapts to the user's current creative state
- **Emotional resonance**: Voice-driven design that reflects the creator's intent
- **Trust through transparency**: Clear affordances, honest feedback, and coherent architecture

### 2.1 Core Principles
1. **Human-Centric AI**: AI should amplify human creativity, not replace it
2. **Precision Over Decoration**: Every element has a functional purpose
3. **Contextual Intelligence**: UI adapts to creative workflow, not forces workflow changes
4. **Emotional Intelligence**: Design evokes the feeling of effective communication
5. **Discoverability**: Every capability must be findable within 3 seconds
6. **Reversibility**: Allow creative experimentation without fear of mistakes

### 2.2 Visual Hierarchy
- **Size**: 6XL (48px) → 4XL (36px) → 2XL (28px) → XL (20px) → BASE (16px) → SM (14px) → XS (12px)
- **Weight**: Semibold (600) → Bold (700) → Medium (500) → Normal (400) → Light (300)
- **Color Priority**: Primary > Secondary > Accent > Muted
- **Motion Intensity**: Subtle → Moderate → Prominent based on importance

---

## 2. Visual Identity

### 2.1 Color System

#### 2.1.1 Semantic Tokens
- **Background**: `hsl(var(--background))` - layer separation
- **Foreground**: `hsl(var(--foreground))` - primary content visibility
- **Card**: `hsl(var(--card))` - component containers
- **Popover**: `hsl(var(--popover))` - contextual surfaces
- **Primary**: `hsl(var(--primary))` - core actions and brand expression
- **Secondary**: `hsl(var(--secondary))` - secondary actions
- **Success**: `hsl(var(--success))` - positive outcomes
- **Warning**: `hsl(var(--warning))` - cautionary states
- **Danger**: `hsl(var(--destructive))` - irreversible actions
- **Muted**: `hsl(var(--muted))` - secondary content and backgrounds
- **Border**: `hsl(var(--border))` - surface separation
- **Input**: `hsl(var(--input))` - form elements
- **Ring**: `hsl(var(--ring))` - focus states
- **Sidebar**: `hsl(var(--sidebar))` - navigation panel
- **SidebarForeground**: `hsl(var(--sidebar-foreground))` - sidebar text

### 2.2 Static Palettes

| Palette | Color | Usage |
|---------|-------|-------|
| **Primary** | `#6C64EE` (Violet) | Brand CTA, AI elements |
| **Amber** | `#FFB800` | Action highlights, warnings |
| **Lavender** | `#A1A1C9` | Secondary actions |
| **Tone Palette** | 9 colors (Professional, Friendly, Creative, etc.) | Voice-specific UI elements |
| **Platform** | Brand-specific colors (WhatsApp, LinkedIn, etc.) | Platform-specific UI elements |
| **Status** | Success, Warning, Danger, Info | Status indicators |

### 2.3 Semantic Color Usage
- **85% Neutral**: 80% of interface uses semantic colors or their tints/shades
- **10% Functional Accent**: Primary/secondary colors for core actions
- **5% Expressive Accent**: Tone/emotion colors for AI voice visualization

### 2.3 Color Application Rules
- **Component Surfaces**: Use semantic tokens or utility classes (`bg-card`, `text-muted-foreground`)
- **Raw Hex Values**: Only allowed in `colors.ts` and `tailwind.config.ts`
- **Tone Colors**: Automatically adjust UI elements when tone is selected
- **Platform Colors**: Brand-specific colors for major platforms (WhatsApp, LinkedIn, etc.)

---

## 4. Typography

### 4.1 Type Scale (px)
| Token | Size | Line Height | Typical Use |
|-------|------|-------------|-----------|
| `micro` | 10px | — | Legacy workspace labels |
| `tiny` | 11px | — | Legacy — migrate to `xs`+ |
| `xs` | 12px | 1.5 | Meta, captions, disabled text |
| **`sm`** | **14px** | **1.5** | Body text, list items |
| **`base`** | **16px** | **1.6** | Default body |
| **`lg`** | 18px | 1.6 | Lead paragraphs |
| **`xl`** | 20px | 1.5 | Card titles |
| **`2xl`** | 24px | 1.4 | Card titles |
| **`3xl`** | 28px | 1.5 | Section headers |
| **`4xl`** | 32px | 1.4 | Hero headings |
| **`5XL`** | 36px | 1.4 | Main headings |
| **`6XL`** | 48px | 0.9 | Hero headings |

### 4.2 Weights
- `normal` (400), `medium` (500), `semibold` (600), `bold` (700)

### 3.3 Typography Rules
- Minimum legible size: **12px** (`xs`)
- Headings use `tracking-tight`
- Hero display uses `leading-[0.95]–1.05`
- Never mix font families — `Inter` for all UI text

---

## 4. Spacing System

### 4.1 Scale (4px base grid)
| Token | Value | Usage |
|-------|-------|-------|
| `0` | `0px` | No spacing |
| `1` | `4px` | Minimal spacing |
| **`2`** | **8px** | Default spacing |
| **`3`** | `12px` | Card level spacing |
| **`4`** | `16px` | Component spacing |
| **`6`** | `24px` | Grid gap |
| **`8`** | `32px` | Container padding |
| **`10`** | `40px` | Page padding |
| **`12`** | `48px` | Screen edge spacing |
| **`16`** | `64px` | Max content width |

### 4.2 Rhythm Rules
- All components must respect the 4px base rhythm
- Horizontal rhythm: `space-x-3`/`space-x-4` (12/16px) for lists and grids
- Vertical rhythm: `space-y-3`/`space-y-4` (12/16px) for card stacks and sections
- No ad-hoc spacing — extend the scale when needed

---

## 7. Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | `4px` | Badges, dots, minimal controls |
| `sm` | `6px` | Small inputs, light emphasis |
| `md` | `8px` | Buttons, cards, moderate emphasis |
| `lg` | `12px` | Primary buttons, message bubbles |
| `xl` | `16px` | Hero surfaces, major cards |
| `2xl` | `16px` | Message bubbles, secondary emphasis |
| `3xl` | `24px` | Large hero elements |
| `4xl` | `32px` | Large hero panels |
| `full` | `9999px` | Fully rounded pills, avatars, dots |

### Usage Rules
- Surfaces share radius based on elevation (lower elevation = smaller radius)
- Interactive elements use the next radius size up
- Bubbles use `rounded-bl-sm`/`rounded-br-sm` "speech" treatment
- Never mix radius sizes within a single surface

---

## 7. Elevation System

| Token | Shadow Value | Usage |
|-------|------------|-------|
| `sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle background elements |
| `md` | `0 1px 3px 0 rgba(0,0,0,0.10)` + `0 1px 4px 0 rgba(0,0,0,0.06)` | Primary surfaces |
| `lg` | `0 1px 3px 0 rgba(0,0,0,0.10)` + `0 1px 8px 0 rgba(0,0,0,0.04)` | Premium surfaces |
| `xl` | `0 2px 4px 0 rgba(0,0,0,0.10)` + `0 4px 5px -2px rgba(0,0,0,0.05)` | Hero surfaces |
| `card` | `0 1px 3px 0 rgba(0,0,0,0.10)` + `0 1px 4px 0 rgba(0,0,0,0.06)` | Default card elevation |
| `premium` | `0 10px 15px -3px rgba(0,0,0,0.08)` + `0 4px 5px -4px rgba(0,0,0,0.03)` | Hero cards, primary buttons |
| `glass` | `<theme-context.title><variants: glass-panel, glass-card>` | Glassmorphism surfaces |
| `dock` | `-8px 0 10px -5px rgba(0,0,0,0.10)` | Bottom navigation |
| `innerGlow` | `0 0 0 1px rgba(0,0,0,0.10)` | Pressed states |

### Usage Rules
- Only one elevation per surface type
- Glow reserved for premium/CTA elements
- Glass surfaces must maintain 4.5:1 contrast

---

## 7. Iconography

- **Library**: `lucide-react` (+ `social-icons.tsx` for brand marks)
- **Size Scaling**:
  - 16px (`w-4 h-4`) in controls/buttons
  - 20px (`w-5 h-5`) in tiles/avatars
  - 24px+ in empty states and feature icons
- **State Consistency**: Same stroke weight within a surface
- **Accessibility**: Always provide `aria-label` for icon-only controls
- **Brand Icons**: Use `social-icons.tsx` for LinkedIn, Twitter, Instagram, etc.

---

## 7. Motion Language

### 8.1 Duration Tokens
| Token | Seconds | Use |
|-------|---------|-------|
| `instant` | `0.1` | Icon hover, tap feedback |
| `fast` | `0.2` | Buttons, chips, small toggles |
| `normal` | `0.35` | Sidebar/panel, card entrances |
| `slow` | `0.5` | Page transitions, modals |
| `verySlow` | `0.7` | Hero, large reveals |

### 8.2 Easing Tokens
| Token | Cubic-bezier | Use |
|-------|--------------|-----|
| `default` | `0.25,0.1,0.25,1` | Standard UI |
| `in` | `0.4,0,1,1` | Exits |
| `out` | `0,0,0.2,1` | Entrances |
| `inOut` | `0.4,0,0.2,1` | Expand/collapse |
| `emphasized` | `0.25,0.46,0.45,0.94` | Cards, featured transitions |
| `emphasizedDecel` | `0.05,0.7,0.1,1` | Material-style entrances |
| `emphasizedAccel` | `0.3,0,0.8,0.15` | Exits |
| `linear` | `linear` | Continuous loops |
| `spring` | - | Organic motion |
| `backOut` | - | Overshoot recovery |

### 8.4 Preset Variants
- **Entrances**: `fadeInUp`, `fadeInScale`, `slideUp`, `slideDown`
- **Buttons**: `hoverScale`, `hoverLift`, `activePress`
- **Cards**: `cardTransition`, `hoverLift`, `selectHighlight`
- **Lists**: `MotionStagger.Fast`, `MotionStagger.Normal`, `MotionStagger.Slow`
- **Loading**: `loading.spin`, `loading.pulse`, `loading.gradient`
- **Semantic**: `MotionPresets.*` and `MotionStagger.{Fast,Normal,Slow,Grid,Sidebar,Messages,Templates,Cards}`

### 8.5 Rules
1. Prefer presets over inline values
2. One loading indicator at a time
3. Exit animations must pair with entrance animations
4. Stagger children ≤ 0.08s; containers only in lists
5. Respect `duration` tokens — no magic numbers

---

## 7. AI Interaction Rules

### 17.1 AI State Visual Language

| State | Visual Behavior | Motion | Audio |
|-------|-----------------|--------|-------|
| **Thinking** | Cursor glow, subtle pulse | Gentle pulse, fadeInUp | Soft hum |
| **Streaming** | Text grows line by line | Fade-in with 30ms stagger | Typing sound |
| **Reasoning** | Neon triangle glow | Quick color flashes | Clicks/snap sounds |
| **Using Knowledge** | Floating knowledge icons | Gentle drift | Soft chime |
| **Using Persona** | Persona avatar glows | Subtle pulse | Gentle chime |
| **Using Tone** | Tone chip pulses | Smooth color transition | Soft chime |
| **Streaming** | Text grows naturally | Text appears line by line | Typing sound |
| **Finished** | Glow pulse + sound | 200ms glow + chime | 400ms |
| **Cancelled** | Fade out with dimming | Fade out (200ms) | 300ms |
| **Regenerated** | Old content fades, new appears | Fade out 200ms, fade in 300ms | 500ms |

### 17.2 Component Interaction Language

- **Button Press**: Scale to 0.98 + shadow shift
- **Tone Chip**: Scale-in with accent gradient border
- **Message Send**: Expand-to-send animation with micro-pause
- **AI Thinking**: Controlled pulse with text animation
- **Tool Execution**: Inline-to-full-panel transition with feedback

### 17.5 Loading States
- **Indeterminate Spinner**: For short operations (<2s)
- **Progress Bar**: For operations with estimated time
- **Skeleton UI**: Placeholder while content loads
- **AIThinking**: Controlled pulse animation with text animation
- **Skeleton Loading**: Gray blocks with pulse for content areas

## 20. Component Inventory

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
| `CommandPalette` | Navigation/actions | Open, active, closed |
| `ToolPanel` | Inline tool execution | Default, full-screen |
| `ContextDrawer` | Knowledge/panel integration | Default, open, closed |
| `CommandPalette` | Navigation/actions | Open, active, closed |
| `SearchOverlay` | Full-text retrieval | All / Conversations / Messages / Prompts / Tones / Knowledge |
| `NotificationPanel` | Real-time notifications | Unread_count, notifications |
| `ContextDrawer` | Context & knowledge attachment | Default, open, closed |

---

## 21. Page Specifications

### 21.1 Landing Page
- **Hero**: Full-screen artistic canvas with animated text
- **Hero CTA**: Primary gradient button with glow effect
- **Interactive Demo**: Scroll-triggered animations
- **Social Proof**: Testimonials with user avatars and quotes
- **CTA Section**: Sequential CTAs (Free → Pro → Enterprise)

### 21.2 Dashboard
- **Top Bar**: Global rail + section header
- **Metrics Grid**: 3-column layout with `space-y-4` spacing
- **Widgetry**: Configurable widget slots with `drag-and-drop`
- **Action Buttons**: Primary CTA with brand gradient + `shadow-glow`
- **Empty State**: Illustration + "Start a new project" CTA

### 21.5 Chat Workspace
- **Left Pane**: Conversation sidebar (280px) with pinned/favorites groups
- **Center**: Thread view with composer, tone bar, message list
- **Right**: Context drawer (drawer pattern, not permanent)
- **Top Bar**: Conversation title, share/export actions
- **Mobile**: Bottom tab bar + drawer/sheet panes

### 21.5 Prompt Library
- **Tabs**: Prompts / Tones / Knowledge
- **Grid View**: Saved prompts + "Use" button
- **List View**: Detailed prompt info with preview
- **Search**: Scope tabs (All / Conversations / Messages / Prompts / Tones / Knowledge)
- **Empty State**: "No prompts saved. Start creating!" with "New Prompt" button

### 21.6 Settings
- **Tabs**: Profile, Appearance, Notifications, Billing, Usage, Danger
- **Profile**: User avatar, name, email, status
- **Appearance**: Theme toggle, accent color picker, font size
- **Notifications**: Channel toggles (chat, email, push), digest settings
- **Billing**: Plan details, upgrade button, usage meters
- **Usage**: Message count, token usage, storage limits

### 21.7 Workspace Rules
- **Panes**: Conversation sidebar (280px), content (flex-grow), context drawer (320px)
- **Modes**: Standard (default), Focus (hide sidebar/context), Writer (minimal chrome)
- **Modes are not navigation** — they change layout density only

### 21.8 Chat Layout Rules
- **Thread View**: Fixed layout with three panes
- **Context Drawer**: Opens from right, 320px width on desktop
- **Thread List**: Pinned > Favorites > Today/Yesterday/This Week/Older
- **Message Grouping**: Same sender = grouped, different sender = separate
- **Quick Actions**: Inline ring with 4 options (Copy, Regenerate, Like, Delete)

### 21.9 Workspace Rules
- **Left Pane**: Conversation list with pinned/favorites grouping
- **Center Pane**: Thread view + composer
- **Right Pane**: Context drawer (merged from AIContextPanel + ContextPanel)
- **Context Actions**: Attach knowledge, apply tone, edit tone
- **Context Drawer**: Always accessible from Compose section

### 21.10 Prompt Library
- **Tabs**: Prompts / Tones / Knowledge
- **Prompts**: Curated templates + saved prompts
- **"Use" Action**: Opens Compose preloaded with prompt and tone
- **Save**: Composer action → Library → Prompts → My saves
- **Tones**: Built-in + custom personas (Settings → Library → Tones)

### 21.11 AI Interaction Rules
- **Transparent Intent**: Tone bar shows current persona/tone
- **Correctability**: Regenerate, edit, continue, or discard
- **Citation**: Show source when relevant (e.g., "Based on knowledge doc")
- **Control**: Temperature (0-100), Creativity (0-100), Platform defaults
- **Consistency**: Same voice applied across message types

---

## 28. Dashboard Layout Rules
- **Top-Left Priority**: Primary metrics (usage, credits, projects)
- **Right-Aligned**: Secondary metrics (storage, usage history)
- **Interactivity**: Click-to-drilldown from summary to detail
- **Spacing**: Minimum 24px between metric clusters
- **Responsive**: Cards stack vertically on mobile, 3-column on desktop

## 22. Chat Layout Rules
- **Fixed Rails**: Always visible navigation rail with labeled destinations
- **Context Panel**: Drawer pattern, not permanent pane
- **Smart Suggestions**: Context-aware actions in conversation flow
- **Inline Actions**: Quick actions within message bubbles
- **Responsive**: Mobile = bottom tab bar + drawer/sheet panes

## 23. Workspace Rules
- **Three Pane Layout**: Sidebar + Content + Context Drawer
- **Modes**: Standard (default), Focus (hide sidebar/context), Writer (minimal chrome)
- **Tools**: Open inline in center pane, no URL change
- **Library**: Sub-nav: Prompts / Tones / Knowledge
- **Search**: Scope tabs: All / Conversations / Messages / Prompts / Tones / Knowledge

## 24. Prompt Editor Rules
- **Tone Bar**: Pre-seeded with persona tone, temperature, emoji usage
- **Smart Suggestions**: Context-aware actions in composer
- **Prompt Library**: Reuse saved prompts with one click
- **Knowledge**: Attach from context drawer or custom tone
- **Save**: Composer action → Library → Prompts → My saves

## 25. Modal System
- **Modal**: `dialog.tsx` with focus trap, Escape to close
- **Error Fallback**: `ErrorFallback` with retry/reload/home/error options
- **Loading**: `PageSkeleton` for content, `PremiumLoading` for AI tasks
- **Error Boundary**: `ErrorBoundary` component with fallback UI

## 26. Loading States
- **Indeterminate Spinner**: For short operations (<2s)
- **Progress Bar**: For operations with estimated time
- **Skeleton UI**: Placeholder for content areas
- **AIThinking**: Controlled pulse animation with text animation
- **Loading States**: Auto-dismiss after 4s for toast notifications

## 27. Empty States
- **Inviting Illustration**: 48px illustration
- **Short Descriptive Text**: 14px, `semantic-foreground/80`
- **Primary CTA**: "New Chat" or "Upload Knowledge"
- **Empty State Component**: Reusable with context-specific variants
- **Consistency**: Reuse `WorkspaceEmptyStates` component with section-specific variants

## 28. Error States
- **Primary Header**: Clear error indication
- **Detailed Message**: Actionable resolution hint
- **Options**: Retry, Dismiss, or Contact Support
- **Visual**: Icon + color coding for semantic meaning
- **Loading States**: Indeterminate spinner + progress bar when applicable

## 29. Loading States
- **Indeterminate Spinner**: For short operations (<2s)
- **Progress Bar**: For operations with estimated time
- **Skeleton UI**: Placeholder for content loading
- **AIThinking**: Controlled pulse animation for generative moments
- **Loading States**: Auto-dismiss after 4s for toast notifications

## 29. Anti-Patterns
- **Modal Overuse**: Replace with inline panels and progressive disclosure
- **Icon-Only Controls**: Always pair with labels or ARIA annotations
- **Gradient Soup**: Limit to hero sections and primary brand elements
- **Auto-Play**: Never auto-start without explicit user trigger
- **Overlapping States**: Never show multiple states simultaneously
- **Implicit State**: Visual cue must match actual state

## 30. Premium Effects
- **Glass Effects**: Used only in premium surfaces (cards, panels)
- **Premium Cursor**: Exclusive interactive cursor with micro-feedback
- **Animated Gradients**: Hero section motion pathways only
- **Micro-Interactions**: Detailed feedback for premium actions
- **Glass Effects**: `bg-card/60` with `backdrop-blur-xl` for premium panels

## 31. Dark Theme
- **Background**: `#1E1E1E` with `foreground: #F9F9F9`
- **Surface**: `#2D2D2D` with `card: #383838`
- **Elevation**: `shadow-card` with `@alpha-75` glow
- **Text**: `muted-foreground` preserved for legibility
- **Contrast**: Maintain 4.5:1 minimum contrast ratio

## 32. Light Theme
- **Background**: `#FFFFFF` with `#FAFAFA` layering
- **Foreground**: `#111827` primary text
- **Surface**: `#FFFFFF` with `#F8F8F8` card surfaces
- **Text**: `#111827` for body, `#4B5563` for secondary
- **Elevation**: `shadow-card` with `@alpha-50` glow
- **Contrast**: Maintain 4.5:1 minimum contrast ratio

## 32. Anti-Patterns
- **Modals for simple actions** → Use inline panels or progressive disclosure
- **Overuse of gradients**: Limit to hero sections and primary CTA
- **Overcrowded UI**: Maximum 3 levels of visual hierarchy
- **Implicit state**: Always show visual cue for state changes
- **Ignoring accessibility**: Contrast ≥ 4.5:1, focus states required
- **Ignoring responsive design**: Drawer pattern for mobile contexts
- **Inconsistent component states**: All components must have 7 states (default, hover, active, focus, disabled, loading, empty)

## 33. Technical Implementation

### 32.1 Token Architecture
- All tokens exported from `src/styles/tokens.ts`
- Access via `import { color, spacing, radius } from "@/styles/tokens"`
- No hardcoded values in components

### 32.2 CSS Strategy
- Tailwind classes remain source of truth for layout
- Utility-first with design tokens for values
- No semantic class names (e.g., `.primary-button`)

### 32.3 Component Structure
- Components live in `/components/` by domain
- Feature components in `/components/workspace/`, `/components/tools/`
- Shared primitives in `/components/ui/`
- All components must pass design token audit

---

## 33. Final Design Principles

1. **Human-Centric AI**: AI should amplify human creativity, not replace it
2. **Intentional Motion**: Every animation must serve purpose and emotion
3. **Precision Over Decoration**: Remove visual noise; keep only meaningful elements
4. **Contextual Intelligence**: UI should adapt to creative workflow, not force workflow changes
5. **Emotional Resonance**: Design should evoke the feeling of effective communication
6. **Discoverability**: Every capability must be findable within 3 seconds
7. **Reversibility**: Allow creative experimentation without fear of mistakes
8. **Progressive Mastery**: Onboard beginners, empower experts, delight power users

## 34. Validation & Testing

- **Visual Consistency**: Run design system audit on all pages
- **Accessibility Testing**: Verify WCAG 2.1 AA compliance
- **Performance Testing**: Ensure <2s load time for critical paths
- **User Testing**: Validate emotional response to AI interaction states
- **Accessibility Testing**: Verify keyboard navigation, screen reader support

## 33. Validation & Testing

- **Visual Consistency**: Use design system tokens across all components
- **Performance**: `npx tsc --noEmit --skipLibCheck` must pass
- **Accessibility**: Run `npm run lint` and accessibility audits
- **Build Verification**: `npx next build` must complete without errors

## 34. Validation Checklist
- [ ] All tokens used in components
- [ ] All components use design tokens
- [ ] All pages use consistent layout principles
- [ ] Mobile views match desktop layout logic
- [ ] Empty states lead to primary action
- [ ] Loading states match component state
- [ ] Error states show clear resolution path
- [ ] Motion respects reduced-motion preferences
- [ ] Brand personality maintained across all screens

## 35. Final Notes

This design system is **frozen** unless a critical issue is discovered during implementation. All future work must align with this document's principles. The design system is version-controlled and will be updated only through formal process.

**Next Steps**: 
1. Create page-specific design specifications
2. Build component blueprints
3. Prototype user journeys
4. Implement via KiloCode/OpenCode with focused tasks

This design system is now complete and ready for implementation.