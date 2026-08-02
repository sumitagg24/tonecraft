# Export System — Product Specification

> **Status:** Design only — no implementation.
> **Phase:** 8.6.
> **Depends on:** 8.1 Knowledge (export with sources), 8.2 Projects
> (project-level export), Compose (message copy already exists).

---

## 1. Purpose

Let users take their work out of ToneCraft and into the world:

```
PDF   DOCX   Markdown   HTML   TXT   Copy   Share   Email   Notion   Slack
```

Copy + Markdown are instant; PDF/DOCX are generated server-side; share/email/
Notion/Slack are delivery targets. Export scope: a single message, a whole
chat, a selection, or an entire project (8.2).

---

## 2. User flow

```
Export menu (message / chat / selection / project)
    │
    ├── Choose scope → message | chat | selection | project
    ├── Choose format → PDF | DOCX | MD | HTML | TXT
    ├── Options → include metadata (tone/model/date), include sources,
    │            theme (light/dark), filename
    ├── Preview (rendered document) → confirm
    └── Delivery → Download | Copy | Email | Share link | Notion | Slack
```

### Entry points

1. **Message card**: export menu (kebab) → export that message.
2. **Chat header**: "Export chat" → whole conversation as a document.
3. **Selection**: select text → export selection (reuses text-selection
   surface).
4. **Project view**: "Export project" → zip archive of chats + files.
5. **Composer**: export the current draft before/after generation.

---

## 3. Formats

| Format | Use case | Engine |
|---|---|---|
| **Markdown** | Default, lossless, editors | local serializer (messages already render MD) |
| **TXT** | Plain, email paste | local serializer |
| **HTML** | Web publishing, rich email | local renderer (markdown → HTML) |
| **PDF** | Formal docs, print | server: HTML → PDF (headless) |
| **DOCX** | Office handoff | server: HTML → DOCX (docx lib) |
| **Copy** | Clipboard paste | navigator.clipboard (exists) |

- **Local formats** (MD/TXT/HTML/copy) are synchronous, zero-cost.
- **Server formats** (PDF/DOCX) are async: request → job → download URL
  (reuses the knowledge job pattern). Notification on completion (8.9).

---

## 4. Document composition

A rendered export includes:

```
Title (chat title / message subject)
Metadata block (optional): date, tone, persona, platform, model, token count
───
Message pairs: user (label) + assistant (content)
Citations/sources (knowledge grounding, 8.1) listed at end
───
Footer: "Generated with ToneCraft"
```

Markdown→HTML conversion reuses `react-markdown` output shapes but serializes
on the server (no client dependency). Code blocks, tables, and lists carry
over; light/dark theme affects inline style injection for PDF/DOCX.

---

## 5. Share & integrations

| Target | Mechanism | MVP? |
|---|---|---|
| **Copy link** | Signed share URL (read-only page) | ✓ |
| **Email** | Compose email with exported MD/TXT body via user's mail client (`mailto:`); premium: server send via provider | ✓ (mailto) / later (send) |
| **Notion** | API: create page from export | Later |
| **Slack** | API: post to channel via user OAuth | Later |
| **Share page** | Server-rendered public (or member) page with the chat/export | ✓ (signed) |

Share links are the 8.6 bridge into collaboration (8.7): a signed view link
today, invites/permissions tomorrow. Links are revocable and expire.

---

## 6. Database changes (design)

```prisma
model ExportJob {
  id          String    @id @default(cuid())
  userId      String
  scope       String    // message|chat|selection|project
  scopeId     String
  format      String    // pdf|docx|html|md|txt
  status      String    // QUEUED|RUNNING|DONE|FAILED
  options     Json?     // theme, includeMetadata, includeSources, filename
  resultKey   String?   // R2 object for generated file
  error       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, createdAt])
  @@index([status, createdAt])
}
```

No schema change for local formats (no job row). Share links:

```prisma
model ShareLink {
  id        String    @id @default(cuid())
  userId    String
  scope     String
  scopeId   String
  token     String    @unique
  expiresAt DateTime?
  revoked   Boolean   @default(false)
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

---

## 7. API endpoints (design)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/export` | Create export job (server formats) or return content (local formats) |
| GET | `/api/export/[id]` | Job status + download URL when done |
| GET | `/api/export/[id]/download` | Stream file (signed) |
| POST | `/api/share` | Create share link |
| GET | `/api/share/[token]` | Resolve share link (auth-light, read-only) |
| DELETE | `/api/share/[token]` | Revoke |
| POST | `/api/integrations/notion` | (later) Push export to Notion |
| POST | `/api/integrations/slack` | (later) Push export to Slack |

Export content generation is server-side for PDF/DOCX (HTML rendering +
conversion), client-side for MD/TXT/HTML/copy.

---

## 8. Frontend architecture

- **`ExportMenu`** — kebab → scope/format/options, reused across message card,
  chat header, and project view.
- **`ExportDialog`** — scope, format picker, options, live preview pane,
  delivery buttons, progress for async jobs.
- **`ExportPreview`** — rendered preview of the chosen format (MD rendered;
  PDF/DOCX show a static preview image or note).
- **`ShareDialog`** — copy link, expiry, revoke, permission hint (8.7).
- **`useExport` hook + `export-store`** — create job, poll status, download;
  local-format exports synchronous.
- **Notification integration:** completion toasts now, 8.9 inbox later.

---

## 9. Security

- Exports include only content the user can access (project membership
  enforced, 8.2/8.7).
- Share links: random 256-bit tokens, optional expiry, revocable; scoped to
  read-only; no membership grants until 8.7.
- Generated files stored in R2 with signed download URLs; content-length and
  type set correctly.
- PDF/DOCX generation runs server-side only (no client-side document
  generation libraries).
- HTML output sanitized (reuses `dompurify` server-side) before embedding in
  PDF/email.

---

## 10. Future improvements

- Batch export (multiple chats/projects → zip).
- Scheduled exports (daily digest of a chat).
- Branded templates (letterhead, company styling).
- CSV export of chat metadata for analysis.
- Browser-native "Save as PDF" fallback.
- Mobile share sheet integration.
- Export directly to Google Docs / Office 365 (later integrations).
