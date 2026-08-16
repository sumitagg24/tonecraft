import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { capabilities } from "@/lib/capabilities";
import { validateFile, DEFAULT_ALLOWED_EXTENSIONS } from "@/lib/file-validation";
import { uploadObject, isStorageConfigured, sanitizeObjectName, StorageError } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

const HARD_SIZE_LIMIT = 25 * 1024 * 1024; // absolute ceiling before plan caps
const MAX_ATTACHMENTS_PER_REQUEST = 10;

const api = withApiHandler({
  rateLimit: { key: "upload", limit: 30, ipLimit: 60 },
});

/**
 * POST /api/upload — multipart with a `file` field. Uploads the file to
 * Cloudflare R2 under `uploads/<userId>/<uuid>-<name>` and returns its
 * storage key + (when configured) a public URL.
 *
 * Security contract:
 *  - Authenticated only; the key is always namespaced by the session user id.
 *  - Magic-byte validation (binary types) / printable check (text types).
 *  - Per-plan file-size, daily-count, and total-storage caps (same limits as
 *    knowledge uploads).
 *  - Fail-closed: without R2 configured the route returns 503 — the client
 *    never silently "uploads" into a void.
 */
export const POST = api.POST(async (ctx) => {
  if (!isStorageConfigured()) {
    return fail("STORAGE_DISABLED", "File storage is not configured", 503);
  }

  const formData = await ctx.request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return fail("BAD_REQUEST", "No file provided", 400);
  if (file.size > HARD_SIZE_LIMIT) {
    return fail("PAYLOAD_TOO_LARGE", "File too large (max 25MB)", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateFile(file.name, file.type, new Uint8Array(buffer), DEFAULT_ALLOWED_EXTENSIONS);
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

  const key = `uploads/${ctx.user.id}/${uuidv4()}-${sanitizeObjectName(file.name)}`;

  let stored;
  try {
    stored = await uploadObject({
      key,
      body: buffer,
      contentType: file.type || validation.mime || "application/octet-stream",
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return fail("UPLOAD_FAILED", error.message, error.status);
    }
    return fail("UPLOAD_FAILED", "Upload failed", 500);
  }

  // Account for the upload against usage counters (files live in R2, size is tracked here).
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

  return ok(
    {
      key: stored.key,
      url: stored.url,
      fileName: file.name,
      fileType: file.type || validation.mime || "application/octet-stream",
      fileSize: file.size,
      maxAttachments: MAX_ATTACHMENTS_PER_REQUEST,
    },
    201
  );
});
