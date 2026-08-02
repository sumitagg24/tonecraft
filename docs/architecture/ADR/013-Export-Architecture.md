# ADR-013: Export Architecture

## Status
Partial (Sync Formats Implemented; Async PDF/DOCX Planned)

## Context
Users need to export conversations, projects, and messages in multiple formats (Markdown, Plain Text, HTML, PDF, DOCX) for sharing, archival, and external workflows.

## Decision
Support two export paths:
1. **Synchronous client-side formats** (MD, TXT, HTML, Copy) — generated in browser, instant.
2. **Asynchronous server-side formats** (PDF, DOCX) — queued as `ExportJob`, processed by worker, downloadable via signed URL.

**Components:**
- `ExportJob` model (id, userId, chatId?, projectId?, format, status, resultKey, error, createdAt, updatedAt)
- `src/lib/export/serialize.ts` — Client serializers for MD/TXT/HTML/JSON.
- `src/services/DocumentService.ts` — Server-side HTML→PDF/DOCX conversion (using `@vercel/og` or `puppeteer`).
- `POST /api/export` — Accepts `{ scope: 'chat'|'project'|'message', id, format }`, returns job or immediate blob.
- `GET /api/export/[id]` — Job status.
- `GET /api/export/[id]/download` — Signed R2 download URL.
- UI: `ExportMenu.tsx` (message/chat/project), `ExportDialog.tsx` (format picker, progress, download).

## Alternatives Considered
1. **All client-side** — PDF/DOCX generation in browser is heavy, inconsistent across devices.
2. **Third-party API (DocRaptor, CloudConvert)** — Cost per export, latency, vendor lock-in.
3. **Serverless functions with headless Chrome** — Chosen; runs in same infra, no extra cost.

## Tradeoffs
- **Pro**: High-fidelity PDF/DOCX; async doesn't block UI; supports large exports.
- **Con**: Requires job queue, storage for results, cleanup policy (TTL 7 days).

## Consequences
- `ExportJob` rows created for PDF/DOCX; client polls status or uses SSE (future).
- R2 bucket `tonecraft-exports` stores generated files with signed 1-hour URLs.
- Cleanup cron deletes jobs older than 7 days and their R2 objects.

## Evidence
- **Model**: `ExportJob` in `prisma/schema.prisma` (lines 387-403)
- **API Routes**: `src/app/api/export/route.ts`, `src/app/api/export/[id]/route.ts`, `src/app/api/export/[id]/download/route.ts`
- **Serializers**: `src/lib/export/serialize.ts`
- **Document Service**: `src/services/DocumentService.ts` (stub — conversion logic planned)
- **UI**: `src/components/workspace/ExportMenu.tsx`, `src/components/workspace/ExportDialog.tsx`