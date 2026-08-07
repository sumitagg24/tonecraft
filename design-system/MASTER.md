# ToneCraft Enterprise Design System v1.0

## 0.0 Document Map

| Phase | Document | Purpose |
|---|---|---|
| 1 | `Vision.md` | Why the product exists — personas, emotional goals, metrics, anti-goals |
| 2 | `Creative-Direction.md` | Mood, inspiration mix, love/hate list |
| 3 | `Art-Direction.md` | Backgrounds, lighting, glass, hero, AI visualization, depth |
| 4 | `Visual-Identity.md` | Type/color/space/radius/button/input philosophy |
| 5 | `Design-System-v1.md` + this file | Exact token values + master rules |
| 6 | `Components/*` (14) | Per-component specs |
| 7 | `Motion.md` | Per-element motion guide (source: `src/styles/motion.ts`) |
| 8 | `Pages/*` (9) | Per-page specs |
| 9 | `Flows/*` (7) | Interaction flows |
| 10 | `Implementation-Prompts.md` | One scoped prompt per page for coding agents |

## 0. Vision & Positioning

**Product Category**: AI-Powered Creative Collaboration Platform
**Target Audience**: Professional creators, writers, marketers, and enterprises seeking expressive, reliable AI interactions with a human touch
**Premium Positioning**: Expressive precision - transforming writing through intentional voices, curated tones, and contextual knowledge integration

## 1. Brand Personality
- **Confident yet approachable**: Professional credibility with creative freedom
- **Playful precision**: Deliberate creativity without chaos; professional tools with personality
- **Human-AI synergy**: Machines that enhance human expression, not replace it
- **Minimalist vibrancy**: Bold accents against clean foundations for intentional emphasis

## 2. Design Philosophy
- **Progressive disclosure**: Reveal complexity only when needed
- **Contextual intelligence**: UI adapts to the user's current creative state
- **Emotional resonance**: Voice-driven design that mirrors the creator's intent
- **Trust through transparency**: Clear affordances, honest feedback, and coherent architecture

## 3. Visual Language
- **Flat surfaces with nuanced depth**: Elevated shadows and layered surfaces for hierarchy
- **Intentional edges**: Rounded corners and precise dividers to guide attention
- **Micro-contrast**: Subtle variations in neutrals for text legibility and focus
- **Motion as storytelling**: Every animation serves narrative purpose

## 4. Color System
### Semantic Tokens
- **Background**: `hsl(var(--background))` - layer separation and canvas
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

### Static Palettes
- **Violet**: `#6C64EE` - Primary brand accent for CTA and AI elements
- **Amber**: `#FFB800` - Action-oriented highlights and warnings
- **Lavender**: `#A1A1C9` - Secondary brand accent for secondary actions
- **Tones**: 9 predefined writing tone colors with semantic mappings
- **Platforms**: Brand-specific colors for major content platforms

### Color Usage Rules
- **85% neutral tone**: 80% of interface should use semantic colors or their tints/shades
- **10% functional accent**: Use primary/secondary for core actions
- **5% expressive accent**: Use tone/emotion colors for AI voice visualization

## 5. Typography
### Hierarchy Scale (px)
- **Micro**: `10px` - Legal text only
- **Tiny**: `11px` - Deprecated - use `xs` sparingly only for metadata
- **XS**: `12px` - Captions, meta, disabled text (16pt minimum legibility)
- **SM**: `14px` - Body text, list items, secondary content
- **BASE**: `16px` - Default UI body text
- **XL**: `18px` - Subheadings, lead paragraphs
- **2XL**: `20px` - Card titles, section headers
- **3XL**: `24px` - Section headers, hero subtext
- **4XL**: `28px` - Section headers, hero subtext
- **4.5XL**: `32px` - Hero headings, major announcements
- **5XL**: `36px` - Main headings, primary titles
- **6XL**: `48px` - Hero headings, major announcements

### Weights & Families
- **Primary**: `Inter` (Sans-serif) - UI text, labels, menus
- **Secondary**: `Inter Monospace` - Code, technical labels
- **Special**: `Custom Script` (not yet implemented) - Notional for voice visualization

### Usage Rules
- **No font mixing**: Always use `Inter` across all UI elements
- **Minimum legibility**: No text below `XS` (12px) without explicit accessibility override
- **Specificity**: Use weight for hierarchy (400 normal, 500 medium, 600 semibold, 700 bold)
- **Spacing scale**: Apply 4px base rhythm to all vertical/horizontal spacing

## 6. Spacing
### Scale (4px base)
- **0**: `0px` - No spacing
- **1**: `4px` - Minimal spacing (icons, dividers)
- **2**: `8px` - Default spacing (buttons, inputs)
- **3**: `12px` - Card level spacing (margin)
- **4**: `16px` - Component spacing (padding)
- **5**: `20px` - Section spacing
- **6**: `24px` - Grid gap
- **8**: `32px` - Container padding
- **10**: `40px` - Page padding
- **12**: `48px` - Screen edge spacing
- **16**: `64px` - Max content width container

### Rhythm Rules
- All components must respect the 4px base rhythm
- Horizontal rhythm: `space-x-3`/`space-x-4` (12/16px) for lists and grids
- Vertical rhythm: `space-y-3`/`space-y-4` (12/16px) for card stacks and sections
- No ad-hoc spacing - extend the scale when needed

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
| `4xl` | `32px` | Premium hero panels |
| `full` | `9999px` | Fully rounded pills, avatars, circular elements |

### Usage Rules
- Surfaces share radius based on elevation (lower elevation = smaller radius)
- Interactive elements use the next radius size up
- Never mix radius sizes within a single surface

## 8. Elevation System
| Token | Shadow Value | Usage |
|-------|--------------|-------|
| `sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Subtle background elements |
| `md` | `0 1px 3px 0 rgba(0, 0, 0, 0.10)` + `0 1px 4px 0 rgba(0, 0, 0, 0.06)` | Primary surfaces |
| `lg` | `0 1px 3px 0 rgba(0, 0, 0, 0.10)` + `0 1px 8px 0 rgba(0, 0, 0, 0.04)` | Premium surfaces |
| `xl` | `0 2px 4px 0 rgba(0, 0, 0, 0.10)` + `0 4px 5px -2px rgba(0, 0, 0, 0.05)` | Hero surfaces |
| `card` | `0 1px 3px 0 rgba(0, 0, 0, 0.10)` + `0 1px 4px 0 rgba(0, 0, 0, 0.06)` | Default card elevation |
| `premium` | `0 10px 15px -3px rgba(0, 0, 0, 0.08)` + `0 4px 6px -4px rgba(0, 0, 0, 0.03)` | Hero cards, primary buttons |
| `glass` | `<theme-context.title><variants: glass-panel, glass-card>` | Glassmorphism surfaces |
| `dock` | `-8px 0 10px -5px rgba(0, 0, 0, 0.10)` | Bottom navigation |
| `innerGlow` | `0 0 0 1px rgba(0, 0, 0, 0.10)` | Pressed states |

### Usage Rules
- Only one elevation per surface type
- Glow reserved for premium/CTA elements
- Glass surfaces must maintain minimum 4.5:1 contrast

## 9. Iconography
- **Primary Icons**: `lucide-react` - 16px for controls, 20px for tiles
- **Brand Marks**: Custom social icons from `social-icons.tsx`
- **State Scaling**: 
  - Enabled: 100% opacity
  - Hover: +10% brightness
  - Active: -5% brightness
  - Disabled: 50% opacity
- **Labeling**: Always provide `aria-label` for icon-only controls
- **Consistency**: Maintain stroke weight consistency within components

## 10. Motion Language
### Duration Tokens
| Token | Seconds | Usage |
|-------|---------|-------|
| `instant` | `0.1` | Icon hover, tap feedback |
| `fast` | `0.2` | Buttons, chips, small toggles |
| `normal` | `0.35` | Sidebar/panel, card entrances |
| `slow` | `0.5` | Page transitions, modals |
| `verySlow` | `0.7` | Hero, large reveals |

### Easing Tokens
| Token | Cubic-bezier | Usage |
|-------|--------------|-------|
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

### Preset Variants
- **Entrances**: `fadeInUp`, `fadeInScale`, `slideUp`, `slideDown`
- **Buttons**: `hoverScale`, `hoverLift`, `activePress`
- **Cards**: `cardTransition`, `hoverLift`, `selectHighlight`
- **Lists**: `MotionStagger.Fast`, `MotionStagger.Normal`, `MotionStagger.Slow`
- **Loading**: `loading.spin`, `loading.pulse`, `loading.gradient`

### Rules
1. No infinite animations behind reduced motion gates
2. Motion must enhance meaning, not decorate
3. Every entrance must have a paired exit
4. Use presets, not inline values
5. Stagger children ≤ 0.08s; containers only in lists

## 11. Interaction Language
### States Required for Interactive Components
- `default`: Base state
- `hover`: Mouse hover
- `active`: Press/tap
- `focus-visible`: Keyboard focus
- `disabled`: Inactive state
- `loading`: Async processing
- `empty`: No content state
- `error`: Fault state

### Micro-interactions
- **Button Press**: Scale to 0.98 + subtle shadow shift
- **Tone Chip**: Scale-in with accent gradient border
- **Message Send**: Expand-to-send animation with micro-pause
- **AI Thinking**: Controlled pulse animation with text animation
- **Tool Execution**: Inline-to-full-panel transition with micro-feedback

## 12. Layout Principles
### Grid System
- **Columns**: 12-column grid
- **Gutter**: 8px between columns
- **Margins**: 16px outer margins
- **Responsive**: Breakpoints at 640px (sm), 768px (md), 1024px (lg), 1440px (xl)

### Section Principles
1. **Rail-First Navigation**: Always visible 5-item rail with labeled icons
2. **Progressive Disclosure**: Tabs within sections for sub-navigation
3. **Contextual Headers**: Section headers with breadcrumb and actions
4. **Fixed Action Bar**: Persistent New Chat button above tab bar on mobile

## 13. Dashboard Principles
- **Contextual Navigation**: One-click access to workspace resources
- **Configurable Metrics**: Customizable overview dashboard
- **At-a-Glance Insights**: Visual meters for usage, credits, projects
- **Permission Hierarchy**: Clear role-based access controls

## 14. Landing Page Principles
- **Value-First Hero**: Clear AI value proposition within 5 seconds
- **Progressive CTA Journey**: Sequential CTAs based on engagement level
- **Trust Building**: Social proof, credentials, and testimonials strategically placed
- **Mobile-First Optimization**: Bottom-up content prioritization

## 15. Chat UX Rules
- **Fixed Rails**: Always visible navigation rail with labeled destinations
- **Context Panel**: Dedicated space for tone/model/knowledge integration
- **Smart Suggestions**: Context-aware actions in conversation flow
- **Inline Actions**: Quick actions within message bubbles
- **Reversible Editing**: Undo/regenerate as core workflow

## 16. AI Interaction Rules
- **Transparency**: Clear voice indication at message creation
- **Correctability**: Allow regeneration and correction
- **Citation**: Cite sources when relevant
- **Control**: User sets temperature/creativity parameters
- **Consistency**: Same voice application across message types

## 17. Component Inventory
| Component | Purpose | States |
|-----------|---------|---------|
| `GlobalRail` | Navigation hub | Default, active, collapsed |
| `SectionHeader` | Context display | Default, dense, compact |
| `ToneChip` | Voice indicator | Default, hover, active |
| `KnowledgeAttach` | Reference attachment | Default, loading, error |
| `PremiumBadge` | Feature tier indicator | Default, premium, limited |
| `CommandPalette` | Navigation accelerator | Open, active, closed |
| `ToolGrid` | Capability browser | Default, search, filters |
| `LibraryTabs` | Asset organization | Prompts, Tones, Knowledge |
| `SearchScopes` | Global retrieval | All, Conversations, Messages, Prompts, Tones, Knowledge |

## 18. Dashboard Layout Rules
- **Emphasis Zones**: Top-left quadrant for primary metrics
- **Contextual Density**: Right-aligned for secondary metrics
- **Interactivity**: Click-to-drilldown from summary to detail
- **Breathing Room**: Minimum 24px padding around metric clusters

## 19. Command Palette Rules
- **One-Click Navigation**: ⌘K triggers full navigation, not search
- **Keyboard-First**: Full keyboard navigation through rail items
- **Action-Oriented**: Focus on actions, not content retrieval
- **Persistent State**: Remembers last 5 used destinations

## 20. Loading States
- **Indeterminate Spinner**: For short operations (<2s)
- **Progress Bar**: For operations with estimated time
- **Skeleton UI**: Placeholder while content loads
- **AIThinking**: Controlled pulse animation for generative moments
- **Skeleton Loading**: Gray blocks with pulse for content areas

## 21. Empty States
- **Invitation**: Clear action suggestion + visual illustration
- **Progressive**: Leads to primary action (e.g., "New Chat")
- **Contextual**: Matches current section focus (e.g., Library empty → "Upload reference")
- **Consistency**: Reuse `WorkspaceEmptyStates` component with context variants

## 22. Error States
- **Primary Header**: Clear error indication
- **Detailed Message**: Actionable resolution path
- **Options**: Retry, Dismiss, or Contact Support
- **Visual**: Icon + color coding for semantic meaning

## 23. Onboarding
- **Three-Step Flow**: Writing type → Language → Default tone
- **Progressive Walkthrough**: Minimal steps with clear next action
- **Personalization**: Seeds composer defaults with user preferences
- **Exit to Compose**: Landing directly on work surface

## 24. Premium Effects
- **Glass Panels**: Semi-transparent surfaces with blur
- **Premium Cursor**: Exclusive interactive cursor for logged-in users
- **Animated Gradients**: Hero section motion pathways
- **Micro-Interactions**: Detailed feedback for premium actions
- **Exclusive Components**: Premium-only UI patterns

## 25. Dark Theme Design
- **Semantic Inversion**: Use same semantic tokens with dark-aware overrides
- **Background**: `#1E1E1E` with `foreground: #F9F9F9`
- **Surface**: `#2D2D2D` with `card: #383838`
- **Elevation**: `shadow-card` with `@alpha-75` glow
- **Text**: `muted-foreground` preserved for legibility
- **Contrast**: Maintain 4.5:1 minimum contrast ratio

## 26. Light Theme Design
- **Background**: `#FFFFFF` with subtle `#FAFAFA` layering
- **Foreground**: `#111827` primary text
- **Surface**: `#FFFFFF` with `#F8F8F8` card surfaces
- **Text**: `#111827` for body, `#4B5563` for secondary
- **Elevation**: `shadow-card` with `@alpha-50` glow
- **Contrast**: Maintain 4.5:1 minimum contrast ratio

## 27. Glass Effects
- **Blur Level**: `backdrop-blur-sm` to `backdrop-blur-xl` based on context
- **Surface Opacity**: `bg-card/60` for modular surfaces
- **Border Treatment**: `border-border/40` for separators
- **Elevation Layering**: Glow effects reserved for premium elements

## 28. Gradients
- **Primary Gradient**: `bg-gradient-to-r from-violet-600 to-indigo-600`
- **Tone Gradients**: Purpose-built gradients for each of 9 tones
- **Status Gradients**: Status colors with 10% opacity overlays
- **Usage Gradients**: Real-time progress visualization

## 29. Visual Hierarchy
- **Size Scale**: 6XL (48px) → 4XL (36px) → 2XL (28px) → XL (20px) → BASE (16px) → SM (14px) → XS (12px)
- **Weight Scale**: Semibold (600) for headings → Bold (700) for hero → Medium (500) for labels
- **Color Priority**: Primary > Secondary > Accent > Muted
- **Motion Intensity**: Subtle → Moderate → Prominent based on importance

## 30. Organization Philosophy

### Asset Organization Rules
- **One Canonical Home**: Each asset type lives in exactly one logical location
- **Libraries Defined**: 
  - **Prompts**: Curated templates for reuse
  - **Tones**: Voice definitions with semantic parameters
  - **Knowledge**: Reference materials for contextual grounding
- **Favorites as First-Class**: Starred assets persist across devices

### Discovery Systems
1. **Library Browsing**: Grid + list views with filtering
2. **Recent First**: Chronological ordering with pinned priority
3. **Search Integration**: Unified retrieval across asset types
4. **Contextual Previews**: Preview actions before application

## 31. Premium Effects Implementation

### Premium Cursor
- **Activation**: All logged-in users
- **Behavior**: Exclusive interactive cursor with micro-feedback
- **Animation**: Subtle trails with purposeful motion

### Pricing & Tier Indication
- **Premium Badge**: `PremiumBadge` component with crown icon and label
- **Tier Differentiation**: Clear visual distinction without complexity
- **Feature Gating**: Premium components only render for eligible users

### Exclusive Components
- **Glass Panels**: Used only in premium surfaces
- **Animated Gradients**: Limited to hero and showcase sections
- **Exclusive Motion**: Premium-only animations

## 32. Technical Implementation

### Token Architecture
- All tokens exported from `src/styles/tokens.ts`
- Access via `import { color, spacing, radius } from "@/styles/tokens"`
- No hardcoded values in components

### CSS Strategy
- Tailwind classes remain source of truth for layout
- Utility-first with design tokens for values
- No semantic class names (e.g., `.primary-button`)

### Component Structure
- Components live in `/components/` by domain
- Feature components in `/components/workspace/`, `/components/tools/`
- Shared primitives in `/components/ui/`
- All components must pass design token audit

## Visual Hierarchy Reference

```
Size: 6XL (48px) → 4XL (36px) → 2XL (28px) → XL (20px) → BASE (16px) → SM (14px) → XS (12px)
Weight: Light (300) → Regular (400) → Medium (500) → Semibold (600) → Bold (700)

Priority Order:
1. Headers (4XL-6XL)
2. Hero CTAs (4XL-4.5XL)
3. Section Titles (2XL-3XL)
4. Body Text (BASE-SM)
5. Captions (XS)
6. Meta (SM with 400 weight)
7. Labels (SM with 500 weight)
8. Placeholders (SM with 400 weight)

Contrast Priority:
1. Primary text (90% opacity)
2. Secondary text (60% opacity)
3. Muted text (40% opacity)
4. Backgrounds (neutral surfaces)
9. Borders (10% opacity)
10. Dividers (1px line)

Motion Priority:
1. Hero animations (slow, emphasized)
2. Interactive states (fast, precise)
2. Micro-interactions (fast, subtle)
3. Transitions (normal, purposeful)
4. Loading states (slow, clear)
```

## Design System Validation

### Implementation Rules
1. **No generic SaaS patterns** - Every decision ties to creative workflow
2. **Every pixel justified** - Size, color, spacing must serve purpose
3. **No orphaned elements** - All UI serves defined buckets
4. **Contextual consistency** - Same component behaves differently based on context
5. **Emotionally intelligent** - UI reflects creative state, not just function

### Anti-Patterns Catalog
- **Modal Overuse**: Replace with inline panels and progressive disclosure
- **Icon-Only Controls**: Always pair with labels or ARIA annotations
- **Gradient Soup**: Limit to hero sections and primary brand elements
- **Auto-Play**: Never auto-start without explicit user trigger
- **Unlabeled States**: Never show empty states without clear next steps
- **Over-Engineered Flows**: Keep user journeys linear and purpose-driven

## Cross-Platform Consistency

### Mobile-First Design
- **Bottom Tab Bar**: Primary navigation on small screens
- **Drawer Pattern**: Secondary actions in slide-over panels
- **Touch Targets**: Minimum 44px tappable area
- **Content Priority**: Top-to-bottom information hierarchy

### Desktop-First Design
- **Rail Navigation**: Persistent 5-item navigation rail
- **Three-Pane Layout**: Conversation, content, context
- **In-Lining Tools**: Execute capabilities without context switching
- **Keyboard Shortcuts**: ⌘K, ⌘N, ⌘1-4 for power navigation

## Final Design Principles

1. **Human-Centric AI**: AI should amplify human creativity, not replace it
2. **Intentional Motion**: Every animation must serve purpose and emotion
3. **Precision Over Decoration**: Remove visual noise; keep only meaningful elements
4. **Contextual Intelligence**: UI should adapt to creative workflow, not force workflow changes
5. **Emotional Resonance**: Design should evoke the feeling of effective communication
6. **Discoverability**: Every capability must be findable within 3 seconds
7. **Reversibility**: Allow creative experimentation without fear of mistakes
8. **Progressive Mastery**: Onboard beginners, empower experts, delight power users