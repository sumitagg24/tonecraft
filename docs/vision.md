# ToneCraft Product Vision & Design Principles (Phase 7)

## Core Value Proposition
ToneCraft is an elite AI-powered voice & text tone transformation studio. It empowers creators, copywriters, and audio engineers to craft, refine, and customize communication styles with real-time AI feedback and high-fidelity controls.

## Visual Identity & Aesthetic Philosophy

### 1. Cyber-Luminescence & Studio Glassmorphism
- Dark, rich backdrop canvases (`#090d16`, `#0f172a`, `#030712`) layered with translucent glassmorphic cards (`rgba(255, 255, 255, 0.03)` to `rgba(255, 255, 255, 0.07)`).
- Glowing neon accent borders (Cyan `#06b6d4`, Indigo `#6366f1`, Violet `#8b5cf6`, Emerald `#10b981`).
- Ambient radial gradients and mouse spotlights for interactive depth.

### 2. Tactile Micro-Interactions
- Smooth spring physics for all dynamic interactions (`framer-motion` spring config).
- Tactile hover feedback: subtle elevation lift (`translateY(-2px)`), glow intensity scaling, active button press dynamics.
- Audio visualizers & animated waveform feedback for active processing states.

### 3. Clear Visual Hierarchy & Accessibility
- High contrast text (`#f8fafc`, `#e2e8f0`) with subtle muted secondary text (`#94a3b8`).
- Visible, high-contrast focus rings (`ring-2 ring-primary/80 offset-dark`).
- Accessible touch targets (minimum 44px on mobile viewports).

## Key User Journey & Workflows
1. **Landing Experience**: High-impact hero with live interactive playground, feature bento grid, workspace preview, and transparent pricing.
2. **AI Studio Workspace**: Multi-pane resizable layout with prompt library, dynamic tone spectrum sliders, real-time message stream, and context inspector.
3. **Dashboard & Tools**: Fast universal search, tool index cards, account usage analytics, and seamless Clerk/Paddle billing integration.
