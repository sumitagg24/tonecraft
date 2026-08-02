# Coverage Matrix

## Methodology
Every **intended subsystem** (determined from the Information Architecture, App-Architecture doc, and core feature set) is mapped to:
1. Its **documentation artefact(s)**
2. Its **implementation code paths**
3. Its **implementation status**

| Subsystem | Documentation Artefact(s) | Implementation Files | Status |
|---|---|---|---|
| **Authentication** | ADR‑003, Architecture‑Evidence.md | `src/hooks/useAccount.ts`, `src/hooks/useAuth.ts`, `src/middleware/auth.ts`, `/app/(dashboard)/sign‑in`, `/app/(dashboard)/sign‑up` | Implemented |
| **AI Engine** | ADR‑001, Architecture‑Evidence.md | `src/engine/AIEngine.ts`, `src/engine/ProviderRouter.ts`, `src/services/ModelRegistry.ts`, `src/lib/capabilities.ts` | Implemented |
| **Billing** | ADR‑002, Architecture‑Evidence.md | `src/billing/providers/paddle/PaddleProvider.ts`, `src/billing/BillingService.ts`, `src/services/UsageGuard.ts` | Implemented |
| **Chat** | ADR‑006, Architecture‑Evidence.md | `src/app/(dashboard)/chat/` routes, `src/hooks/use-chat.ts`, `src/components/workspace/ChatInput.tsx`, `src/components/workspace/ChatList.tsx`, `src/components/workspace/ChatMessage.tsx` | Implemented |
| **Projects** | ADR‑007, Architecture‑Evidence.md | `src/services/ProjectService.ts`, `src/repositories/ProjectRepository.ts`, `src/app/api/projects/...` | Implemented |
| **Personas** | ADR‑003 (usage), Architecture‑Evidence.md | `prisma/schema.prisma (Persona model)`, `src/services/PersonaService.ts`, `src/app/api/personas/...` | Implemented |
| **Prompt Library** | Architecture‑Evidence.md | `prisma/schema.prisma (Prompt model)`, `src/services/PromptService.ts`, `src/app/api/prompts/...` | Implemented |
| **Knowledge** | ADR‑008, Architecture‑Evidence.md | `src/services/KnowledgeService.ts`, `src/lib/knowledge/extract.ts`, `src/lib/knowledge/chunk.ts`, `src/app/api/knowledge/...` | Partial |
| **Search** | ADR‑009, Architecture‑Evidence.md | `src/services/SearchService.ts`, `src/app/api/search/...` | Partial |
| **Notifications** | ADR‑011, Architecture‑Evidence.md | `src/services/NotificationService.ts`, `src/app/api/notifications/...`, `src/components/shell/NotificationCenter.tsx` | Implemented |
| **Offline** | ADR‑012, Architecture‑Evidence.md | `src/stores/offline-store.ts`, `src/app/api/outbox/...`, `src/components/shared/OfflineIndicator.tsx` | Planned |
| **Export** | ADR‑013, Architecture‑Evidence.md | `src/app/api/export/...`, `src/services/DocumentService.ts`, `src/components/workspace/ExportMenu.tsx` | Partial |
| **Analytics** | ADR‑014, Architecture‑Evidence.md | `src/services/AnalyticsService.ts`, `src/app/api/analytics/...`, `src/engine/AIEngine.ts` | Partial |
| **Collaboration** | ADR‑015, Architecture‑Evidence.md | `prisma/schema.prisma` (`ProjectMember`, `Comment`), `src/components/shared/CommentThread.tsx` | Planned |
| **Design System** | ADR‑005, Architecture‑Evidence.md | `src/styles/tokens.ts`, `src/styles/spacing.ts`, `src/styles/typography.ts` | Implemented |
| **Navigation** | ADR‑006, Architecture‑Evidence.md | `src/app/(dashboard)/layout.tsx`, `src/components/shell/AppShell.tsx`, `src/components/shell/NavigationRail.tsx`, `src/components/shell/TopBar.tsx` | Implemented |
| **Dark Mode** | ADR‑005, Design System | `src/styles/colors.ts` (`theme` config), `src/hooks/use-theme.ts` | Implemented |
| **Mobile Responsiveness** | ADR‑006, Design System | `src/components/shell/MobileBottomBar.tsx`, `src/components/shell/MobileRailDrawer.tsx`, Tailwind breakpoints | Implemented |
| **Keyboard Shortcuts** | ADR‑006, Accessibility docs | `src/hooks/use-keyboard-shortcuts.ts`, `src/hooks/use-command-palette.ts` | Implemented |

> **Legend**:  
> ✅ **Implemented** – Feature built, tested, and live.  
> ⚠️ **Partial** – Core logic present but incomplete (e.g., retrieval missing, async jobs pending).  
> 🚧 **Planned** – Models/UI scaffolding or documentation exists; full implementation pending.