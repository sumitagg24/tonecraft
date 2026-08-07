# ToneCraft — Implementation Prompts

> Phase 10 · One scoped, repeatable prompt per page.
> Each prompt implements **one page only**, reading only the listed design docs.
> Rules apply to every prompt: **follow the visual language exactly. Do not invent layouts or features. Do not modify architecture. Responsive on desktop/tablet/mobile. Use shadcn components and design tokens. Framer Motion only where the Motion.md guide specifies. Run lint, typecheck, build. Fix every error. Stop.**

---

## File Map

```
design-system/
├── MASTER.md                  ← the 32-section master design language
├── Vision.md                  ← why the product exists (Phase 1)
├── Creative-Direction.md      ← mood + inspiration (Phase 2)
├── Art-Direction.md           ← backgrounds, hero, depth (Phase 3)
├── Visual-Identity.md         ← type/color/space philosophy (Phase 4)
├── Motion.md                  ← motion guide (Phase 7)
├── Design-System-v1.md        ← exact token values
├── Pages/                     ← page specs (9)
├── Components/                ← component specs (14)
└── Flows/                     ← interaction flows (7)
```

Standard prompt skeleton (fill in the bold fields):

```
Implement ONLY the {PAGE} page.
Read ONLY: Vision.md, Creative-Direction.md, Visual-Identity.md, Motion.md,
Design-System-v1.md, Pages/{Page}.md, Components/{components}.md
Rules: follow the visual language exactly; do not invent layouts or features;
do not modify architecture; responsive desktop/tablet/mobile; shadcn components;
Framer Motion only where Motion.md specifies; run npm run lint, npm run typecheck,
npm run build; fix every error; stop.
```

---

## Prompt — Landing

Implement ONLY the Landing Page.
Read: `Vision.md`, `Creative-Direction.md`, `Art-Direction.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Landing.md`, `Components/Button.md`, `Components/Card.md`, `Components/NavigationRail.md`.
Rules: editorial hero with word-morphing display type; layered background (glow + noise); one primary CTA; glass preview cards; motion only from `Motion.md` §6 (Hero) & §2 (Buttons); no new sections beyond the spec.

## Prompt — Dashboard

Implement ONLY the Dashboard.
Read: `Vision.md`, `Creative-Direction.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Dashboard.md`, `Components/NavigationRail.md`, `Components/TopBar.md`, `Components/Card.md`, `Components/PageHeader.md`.
Rules: rail-first navigation unchanged; metrics in the top-left emphasis zone; 24px+ breathing room around metric clusters; `MotionStagger.Cards` for widget entrances; no new widgets.

## Prompt — Chat

Implement ONLY the Chat Workspace.
Read: `Vision.md`, `Creative-Direction.md`, `Art-Direction.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Chat.md`, `Components/Composer.md`, `Components/Message.md`, `Components/ContextDrawer.md`, `Flows/AI-Generation-Flow.md`.
Rules: do not redesign the architecture; implement AI states exactly as `Motion.md` §7 (thinking / streaming / tool activation); tone chips are first-class UI; `messageVariants` for bubbles; no invented layouts.

## Prompt — Workspace (Collaboration)

Implement ONLY the collaborative Workspace.
Read: `Vision.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Workspace.md`, `Components/Sidebar.md`, `Components/TopBar.md`, `Components/Card.md`, `Flows/Workspace-Collaboration-Flow.md`.
Rules: presence indicators, typing indicators, and version/activity feeds follow `Motion.md` §4 & §7 (`loading.typing`, `MotionStagger.Normal`); keep the existing collaboration architecture intact; no new features.

## Prompt — Prompt Library

Implement ONLY the Prompt Library.
Read: `Vision.md`, `Creative-Direction.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Prompt-Library.md`, `Components/PromptCard.md`, `Components/PersonaCard.md`, `Components/KnowledgeCard.md`, `Components/Sidebar.md`, `Flows/New-Chat-Flow.md`.
Rules: implement exactly as specified; do not add filters or features beyond the spec; grid/list views with `MotionStagger.Grid`; search overlay from the spec; responsive + accessible.

## Prompt — Knowledge

Implement ONLY the Knowledge library.
Read: `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Knowledge.md`, `Components/KnowledgeCard.md`, `Components/Input.md`, `Components/Card.md`.
Rules: upload/attach states (idle → uploading → done → error) use `loading.pulse` and `ai.contextUpdate`; citations render as tone-colored chips; no new storage features.

## Prompt — Billing & Plans

Implement ONLY the Billing page.
Read: `Vision.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Billing.md`, `Components/Button.md`, `Components/Card.md`, `Components/Modal.md`, `Flows/Billing-Flow.md`.
Rules: pricing cards use `hoverLift.pricing`; amber accent only for upgrade moments; premium badge gating per `MASTER.md` §31; no new plans or payment logic.

## Prompt — Settings

Implement ONLY the Settings pages.
Read: `Vision.md`, `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Settings.md`, `Components/Input.md`, `Components/Button.md`, `Components/Modal.md`, `Components/Card.md`.
Rules: no new settings, no layout changes; respect design tokens; responsive + accessible; form fields per `Visual-Identity.md` §9 (label above, inline validation after input).

## Prompt — Admin

Implement ONLY the Admin dashboard.
Read: `Visual-Identity.md`, `Motion.md`, `Design-System-v1.md`, `Pages/Admin.md`, `Components/Card.md`, `Components/TopBar.md`, `Components/PageHeader.md`.
Rules: dense-but-breathing data surfaces (`spacing-4/6`); charts use tabular numbers + semantic status colors; no new metrics or sections; keep RBAC navigation intact.

---

## Cross-Cutting Rules (applies to every prompt)

1. **Tokens, not literals** — colors from `src/styles/colors.ts`, spacing/radius/elevation/typography from `src/styles/tokens.ts`. No hardcoded hex or magic spacing.
2. **shadcn components** — build on the existing `src/components/ui/*` primitives; don't re-create buttons, cards, dialogs.
3. **Motion only where specified** — check `Motion.md` for the element; otherwise use static styling.
4. **Every state** — empty, loading, error states per `MASTER.md` §20–22; never a bare page.
5. **Accessibility** — `aria-label` on icon-only controls, 44px touch targets, focus-visible rings, reduced-motion gate.
6. **Verification** — `npm run lint` → `npm run typecheck` → `npm run build`. Fix all errors. Do not touch code outside the page's scope.
7. **Stop** — when the page is done and green, stop. Do not "improve" adjacent pages.
