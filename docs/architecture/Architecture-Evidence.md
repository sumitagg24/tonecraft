# Architecture Evidence — ToneCraft

## Purpose
This document provides traceable evidence for each architectural decision in ToneCraft, sourced directly from the codebase. Every claim references files, models, routes, or services.

---

## 1. Next.js Routing Structure

### Status: Implemented (App Router)

**Decision**: The application uses **Next.js App Router** (`src/app/...`), not Pages Router.

**Evidence**:
- Layout file: `src/app/(dashboard)/layout.tsx`
- Nested routes under `/app/(dashboard)/`:
  - `/app/(dashboard)/page.tsx` — Dashboard/Compose landing
  - `/app/(dashboard)/chats/[id]/page.tsx` — Individual chat
  - `/app/(dashboard)/tools/page.tsx` — Tools catalog
  - `/app/(dashboard)/library/prompts/page.tsx` — Prompt Library
  - `/app/(dashboard)/library/tones/page.tsx` — Tones/Personas
  - `/app/(dashboard)/search/page.tsx` — Global search
  - `/app/(dashboard)/account/billing/page.tsx` — Billing
  - `/app/(dashboard)/account/usage/page.tsx` — Usage meters

**No `src/pages/` directory exists** — all routes use App Router conventions.

---

## 2. AI Engine & Core Services

### Status: Implemented

**Decision**: The AI Engine orchestrates intent resolution, context building, and provider routing.

**Evidence**:
- **Engine**: `src/engine/AIEngine.ts` — Main entry point (`generate()`, `stream()`)
- **Context Builder**: `src/engine/ContextBuilder.ts` — Assembles system messages, persona, knowledge blocks
- **Intent Engine**: `src/engine/IntentEngine.ts` — Maps intent types to model configurations
- **Types**: `src/engine/types.ts` — Defines `EngineOptions`, `BuiltContext`

**Key Workflow** (AIEngine.ts lines 47‑66):
```typescript
const built = this.contextBuilder.build({
  history: options.history,
  currentMessage: promptText,
  persona: options.persona,
  knowledge: options.context?.knowledgeBlock
    ? { systemBlock: String(options.context.knowledgeBlock) }
    : undefined,
});
```

---

## 3. Provider Router, Model Registry, Capability Registry

### Status: Implemented (Partial — Capabilities embedded in Router)

**Decision**: Provider routing is handled by `ProviderRouter`; capabilities live in the router + config files rather than a standalone registry.

**Evidence**:
- **ProviderRouter**: `src/engine/ProviderRouter.ts`
  - `route()` (lines 33‑83) and `stream()` (lines 85‑134) select providers
  - `resolveQueue()` (lines 136‑163) filters by capability tier
  - Uses `capabilities.resolveCapabilityTier()` from `src/lib/capabilities.ts`
- **ModelRegistry**: `src/services/ModelRegistry.ts`
  - `resolve(plan)` returns models compatible with plan tier
  - `getModelsByCapability()` queries config for capability matching
- **Models Config**: `src/config/models.ts`
  - Defines `ModelEntry` with `capabilities: ModelCapabilities`
  - `capabilityTier` field for routing priority

**No separate `CapabilityRegistry` service** — capability logic is embedded in `capabilities.ts`.

---

## 4. Billing Architecture & Paddle Integration

### Status: Implemented

**Decision**: Billing uses **Paddle** exclusively for subscriptions; token usage is tracked internally.

**Evidence**:
- **Paddle Provider**: `src/billing/providers/paddle/PaddleProvider.ts`
- **Payment Provider Interface**: `src/billing/PaymentProvider.ts`
- **Billing Service**: `src/billing/BillingService.ts`
- **Usage Guard**: `src/services/UsageGuard.ts`
  - `canAfford()` — Verifies credits before generation
  - `record()` — Logs token usage (lines 69‑117)
  - `check()` — Returns allowance status

**Integration Point** (AIEngine.ts lines 69‑75):
```typescript
if (options.userId && options.plan) {
  const minCost = minCreditCost(options.plan, options.modelId);
  const canProceed = await usageGuard.canAfford(options.userId, minCost);
  if (!canProceed) throw new Error("Insufficient credits");
}
```

---

## 5. Clerk Authentication

### Status: Implemented

**Decision**: Clerk provides authentication via hosted UI and client-side hooks.

**Evidence**:
- **Sign-in/Sign-up Routes**: `/app/(dashboard)/sign-in/page.tsx`, `/app/(dashboard)/sign-up/page.tsx`
- **Auth Hook**: `src/hooks/useAccount.ts` — Provides `user`, `organization` state
- **Middleware**: `src/middleware/auth.ts` — Protects routes using `auth().protect()`
- **Session Propagation**: Server components use `auth().getAuth()` for SSR data

---

## 6. Projects

### Status: Implemented

**Decision**: Projects provide hierarchical organization with chats, prompts, personas, and knowledge files.

**Evidence**:
- **Schema**: `Prisma` model `Project` (`prisma/schema.prisma` lines 193‑217)
  - Fields: `id`, `name`, `emoji`, `color`, `description`, `parentId`, `children`, `archived`
- **Service**: `src/services/ProjectService.ts`
  - CRUD methods: `createProject`, `updateProject`, `deleteProject`
  - `moveChat()` — Moves chats between projects
- **API Routes**: `src/app/api/projects/route.ts`, `[id]/route.ts`
- **UI**: Project tree sidebar (`src/components/sidebar/ProjectTree.tsx`)

---

## 7. Personas (Custom Tones)

### Status: Implemented

**Decision**: Personas are stored entities with tone, style, and platform settings.

**Evidence**:
- **Schema**: `Prisma` model `Persona` (`prisma/schema.prisma` lines 116‑138)
- **Service**: `src/services/PersonaService.ts`
  - CRUD methods, `setDefault()`
- **Integration**: Used in `ContextBuilder.ts` (lines 39‑42) to inject `systemPrompt`
- **Library Routes**: `/library/tones` hosts persona management

---

## 8. Prompt Library

### Status: Implemented

**Decision**: Prompts are user-curated templates with variable substitution.

**Evidence**:
- **Schema**: `Prisma` model `Prompt` (`prisma/schema.prisma` lines 232‑251)
- **Service**: `src/services/PromptService.ts`
  - `renderTemplate()` — Replaces `{{variable}}` tokens
  - `extractVariables()` — Discovers template variables
- **API Routes**: `src/app/api/prompts/route.ts`, `[id]/route.ts`, `import/route.ts`
- **Library UI**: `src/app/(dashboard)/library/prompts/page.tsx`

---

## 9. Knowledge System

### Status: Partial (Upload, Parsing, Chunking → Implemented; Retrieval, Citations → Planned)

**Decision**: Knowledge uploads are processed but **vector retrieval is not yet active** (JSON embeddings stored, no pgvector queries).

**Evidence**:
- **Models**: `KnowledgeFile`, `KnowledgeChunk`, `KnowledgeJob` in `prisma/schema.prisma` (lines 253‑307)
- **Embedding Storage**: `KnowledgeChunk.embedding` is `Json?` (line 281), not `vector(1536)`
- **Service**: `src/services/KnowledgeService.ts`
  - `create()` — Uploads file, extracts text, chunks (lines 20‑58)
  - `retrieve()` — Performs BM25 keyword scoring (lines 83‑106)
- **Library Route**: `/library/knowledge` mounts a working upload surface
- **Chunks Stored**: `src/lib/knowledge/chunk.ts` contains `chunkText()` and `searchScore()`
  - `searchScore()` uses simple text similarity, not vector distance

**Planned**:
- Add `vector(1536)` column for pgvector-backed similarity
- Implement cosine similarity in `knowledgeService.retrieve()`
- Add citation UI (`MessageKnowledgeChips`)

---

## 10. Search Implementation

### Status: Partial (Keyword search implemented; Vector search Planned)

**Decision**: Search currently uses **BM25/keyword matching** across chats, messages, prompts, personas, and knowledge.

**Evidence**:
- **Service**: `src/services/SearchService.ts`
  - `search()` (lines 7‑55) performs `contains` queries with `mode: "insensitive"`
  - Searches 5 entity types: `chats`, `messages`, `prompts`, `personas`, `knowledge`
- **Repository**: `src/repositories/ChatRepository.ts`, `MessageRepository.ts` use `prisma.$queryRaw` for text search

**Not Implemented**:
- No vector index or similarity search
- No pgvector extension enabled

---

## 11. Export System

### Status: Partial (Sync formats → Implemented; Async PDF/DOCX → Partial)

**Evidence**:
- **API Routes**: `src/app/api/export/route.ts`, `[id]/route.ts`, `[id]/download/route.ts`
- **Model**: ExportJob in `prisma/schema.prisma` (lines 387‑403)
- **Service**: `src/services/AnalyticsService.ts` contains `export` event hook (future)
- **Supported Formats**: Markdown, Plain Text, HTML (client-side); PDF, DOCX via job queue (server-side)

---

## 12. Notifications

### Status: Implemented

**Evidence**:
- **Models**: `Notification`, `NotificationPreference` in Prisma schema
- **Service**: `src/services/NotificationService.ts`
- **Route**: `src/app/api/notifications/route.ts`, `stream/route.ts` (SSE)
- **SSE Endpoint**: `/api/notifications/stream` pushes notifications in real-time

---

## 13. Offline Support

### Status: Partial (Structure exists; Activation Planned)

**Evidence**:
- **Service Worker**: `public/sw.js` (basic caching shell present)
- **Outbox Store**: `src/stores/offline-store.ts`
- **Service**: `src/services/OfflineService.ts` (stub with queue types)
- **UI**: `src/components/shared/OfflineIndicator.tsx`, `SyncBar.tsx`

**Not Fully Activated**:
- No background sync logic
- No outbox pattern for message queuing

---

## 14. Collaboration

### Status: Planned

**Evidence**:
- **Model**: `ProjectMember` in Prisma schema (lines 219‑230)
  - Fields: `projectId`, `userId`, `role`
- **No Implementation**:
  - Invites table not yet activated (`Invite` model mentioned in docs but not in schema)
  - Comment threads not implemented (`Comment` model exists but API missing)
  - No sharing links beyond `ShareLink` (read-only chats)

---

## 15. Analytics

### Status: Partial (Event logging implemented; Dashboards Planned)

**Evidence**:
- **Service**: `src/services/AnalyticsService.ts`
  - `trackEvent()` logs to `logger.info`
- **Usage Tracking**: `AIEngine.trackUsage()` writes to `prisma.usageRecord`
- **Dashboard**: `src/app/(dashboard)/analytics/page.tsx` (stub page exists)

---

## 16. Feature Flags

### Status: Implemented

**Evidence**:
- **Service**: `src/services/FeatureFlagService.ts`
- **Provider**: `src/billing/providers/noop/NoopPaymentProvider.ts` (example flag usage)

---

## Summary Table

| Component | Status | Key Files |
|-----------|--------|-----------|
| Routing | Implemented | `src/app/(dashboard)/...` |
| AI Engine | Implemented | `src/engine/AIEngine.ts` |
| Provider Router | Partial | `src/engine/ProviderRouter.ts`, `src/lib/capabilities.ts` |
| Billing | Implemented | `src/billing/providers/paddle/PaddleProvider.ts` |
| Auth | Implemented | `src/hooks/useAccount.ts`, `src/middleware/auth.ts` |
| Projects | Implemented | `src/services/ProjectService.ts` |
| Personas | Implemented | `src/services/PersonaService.ts` |
| Prompts | Implemented | `src/services/PromptService.ts` |
| Knowledge | Partial | `src/services/KnowledgeService.ts`, `prisma/schema.prisma` |
| Search | Partial | `src/services/SearchService.ts` |
| Export | Partial | `src/app/api/export/...`, `prisma/schema.prisma` |
| Notifications | Implemented | `src/services/NotificationService.ts` |
| Offline | Partial | `src/lib/offline/...`, `src/stores/offline-store.ts` |
| Collaboration | Planned | `prisma/schema.prisma` (ProjectMember) |
| Analytics | Partial | `src/services/AnalyticsService.ts` |

---

*Generated from repository inspection on 2026-08-02.*