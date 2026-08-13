import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { prisma } from "@/lib/prisma";
import { getStorageClient, isStorageConfigured } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { capabilities } from "@/lib/capabilities";
import { validateFile } from "@/lib/file-validation";

function sanitizeFilename(name: string): string {
  // Remove path traversal sequences and null bytes
  const sanitized = name
    .replace(/\0/g, "")
    .replace(/[\/\\..]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  // Ensure it doesn't start with dot (hidden file)
  return sanitized.startsWith(".") ? sanitized.slice(1) : sanitized || "unnamed";
}

const api = withApiHandler();

export const POST = api.POST(async (ctx) => {
  // multipart/form-data — the wrapper skips JSON body parsing for this content type
  const formData = await ctx.request.formData();
  const file = formData.get("file") as File | null;
  const messageId = formData.get("messageId") as string | null;

  if (!file) {
    return fail("BAD_REQUEST", "No file provided", 400);
  }

  // Plan-aware limits first (audit 12 P0.4): reject oversized files BEFORE reading
  // the body into memory, so a large upload can never be a memory DoS.
  const plan = await capabilities.require({ userId: ctx.user.id, action: "upload-file" });
  const maxSize = plan.limits.maxFileSize;
  const maxFilesPerDay = plan.limits.maxFilesPerDay;
  const maxStorageBytes = plan.limits.maxStorageMB * 1024 * 1024;

  if (file.size > maxSize) {
    return fail(
      "PAYLOAD_TOO_LARGE",
      `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
      413
    );
  }

  const usage = await prisma.usage.findUnique({ where: { userId: ctx.user.id } });
  if (maxFilesPerDay !== Infinity && (usage?.filesUploaded ?? 0) >= maxFilesPerDay) {
    return fail("RATE_LIMITED", "Daily upload limit reached", 429);
  }
  if ((usage?.storageUsed ?? 0) + file.size > maxStorageBytes) {
    return fail("PAYLOAD_TOO_LARGE", "Storage limit reached", 413);
  }

  // Now read and validate content (never trust the client MIME).
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  const validation = validateFile(file.name, file.type, buffer);
  if (!validation.ok) {
    return fail("UNSUPPORTED_MEDIA_TYPE", validation.reason, 415);
  }
  const safeMimeType = validation.mime;

  // Sanitize filename to prevent path traversal
  const safeName = sanitizeFilename(file.name);

  const key = `uploads/${ctx.user.id}/${uuidv4()}-${safeName}`;

  if (!isStorageConfigured()) {
    return fail("SERVICE_UNAVAILABLE", "File storage is not configured", 503);
  }

  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: safeMimeType,
      ContentDisposition: "attachment",
    })
  );

  const publicUrl = `${process.env.STORAGE_PUBLIC_URL}/${key}`;

  // Save attachment to DB if messageId provided
  if (messageId) {
    const message = await prisma.message.findFirst({
      where: { id: messageId, chat: { userId: ctx.user.id } },
      select: { id: true },
    });
    if (message) {
      await prisma.attachment.create({
        data: {
          messageId,
          fileName: safeName,
          fileType: safeMimeType,
          fileSize: file.size,
          storageKey: key,
        },
      });
    }
  }

  // Update usage stats
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

  return ok({
    key,
    url: publicUrl,
    fileName: safeName,
    fileType: safeMimeType,
    fileSize: file.size,
  });
});
