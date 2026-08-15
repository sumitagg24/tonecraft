import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { knowledgeService } from "@/services/KnowledgeService";
import { notificationService } from "@/services/NotificationService";
import { auditLogService } from "@/services/AuditLogService";
import { fireAndForget } from "@/lib/fire-and-forget";
import { capabilities } from "@/lib/capabilities";
import { prisma } from "@/lib/prisma";
import { validateFile, KNOWLEDGE_ALLOWED_EXTENSIONS } from "@/lib/file-validation";

const HARD_SIZE_LIMIT = 25 * 1024 * 1024; // absolute ceiling before plan caps

const api = withApiHandler();

export const GET = api.GET(async (ctx) => {
  const projectId = ctx.request.nextUrl.searchParams.get("projectId") || null;
  const files = await knowledgeService.list(ctx.user.id, projectId);
  return ok({ files });
});

export const POST = api.POST(async (ctx) => {
  // multipart/form-data — the wrapper skips JSON body parsing for this content type
  const formData = await ctx.request.formData();
  const file = formData.get("file") as File | null;
  const projectId = (formData.get("projectId") as string | null) || null;

  if (!file) return fail("BAD_REQUEST", "No file provided", 400);
  if (file.size > HARD_SIZE_LIMIT) {
    return fail("PAYLOAD_TOO_LARGE", "File too large (max 25MB)", 413);
  }

  // Content validation: document-only allowlist + magic-byte sniffing (audit 12 P0.4).
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateFile(file.name, file.type, new Uint8Array(buffer), KNOWLEDGE_ALLOWED_EXTENSIONS);
  if (!validation.ok) {
    return fail("UNSUPPORTED_MEDIA_TYPE", validation.reason, 415);
  }

  // Plan caps: per-file size, daily count, total storage.
  const plan = await capabilities.require({ userId: ctx.user.id, action: "upload-file" });
  const maxSize = Math.min(plan.limits.maxFileSize, HARD_SIZE_LIMIT);
  if (file.size > maxSize) {
    return fail("PAYLOAD_TOO_LARGE", "File too large for your plan", 413);
  }
  const usage = await prisma.usage.findUnique({ where: { userId: ctx.user.id } });
  if (plan.limits.maxFilesPerDay !== Infinity && (usage?.filesUploaded ?? 0) >= plan.limits.maxFilesPerDay) {
    return fail("RATE_LIMITED", "Daily upload limit reached", 429);
  }
  if ((usage?.storageUsed ?? 0) + file.size > plan.limits.maxStorageMB * 1024 * 1024) {
    return fail("PAYLOAD_TOO_LARGE", "Storage limit reached", 413);
  }

  const created = await knowledgeService.create(ctx.user.id, file.name, buffer, projectId);

  // Account for the upload against usage counters (knowledge files live in Postgres).
  await prisma.usage.upsert({
    where: { userId: ctx.user.id },
    create: {
      userId: ctx.user.id,
      filesUploaded: 1,
      storageUsed: file.size,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      filesUploaded: { increment: 1 },
      storageUsed: { increment: file.size },
    },
  });
  fireAndForget(
    notificationService.create({
      userId: ctx.user.id,
      type: "knowledge_indexed",
      title: "Document indexed",
      body: `"${created.name}" is ready to ground your responses.`,
      link: "/library",
    }),
    "notification.knowledgeIndexed",
    { userId: ctx.user.id, knowledgeFileId: created.id }
  );

  void auditLogService.record("knowledge.upload", "knowledge_file", {
    actorId: ctx.user.id,
    resourceId: created.id,
    metadata: { fileName: created.name, fileSize: created.fileSize },
  });
  return ok(created, 201);
});
