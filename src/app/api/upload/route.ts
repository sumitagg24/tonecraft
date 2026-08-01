import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { capabilities } from "@/lib/capabilities";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "application/json",
  "application/xml",
  "audio/mpeg",
  "audio/wav",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "txt", "html", "css", "js", "json", "xml",
  "mp3", "wav",
]);

function sanitizeFilename(name: string): string {
  // Remove path traversal sequences and null bytes
  const sanitized = name
    .replace(/\0/g, "")
    .replace(/[\/\\..]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  // Ensure it doesn't start with dot (hidden file)
  return sanitized.startsWith(".") ? sanitized.slice(1) : sanitized || "unnamed";
}

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const messageId = formData.get("messageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type against allowlist
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 415 }
      );
    }

    // Validate extension against allowlist
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: "File extension not allowed" },
        { status: 415 }
      );
    }

    // Sanitize filename to prevent path traversal
    const safeName = sanitizeFilename(file.name);
    const safeMimeType = mimeType; // Already validated above

    // Plan-aware size limit
    const plan = await capabilities.require({ userId: session.user.id, action: "upload-file" });
    const maxSize = plan.limits.maxFileSize;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
        },
        { status: 413 }
      );
    }

    const key = `uploads/${session.user.id}/${uuidv4()}-${safeName}`;
    const bytes = await file.arrayBuffer();

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(bytes),
        ContentType: safeMimeType,
        ContentDisposition: "attachment",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Save attachment to DB if messageId provided
    if (messageId) {
      const message = await prisma.message.findFirst({
        where: { id: messageId, chat: { userId: session.user.id } },
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
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        filesUploaded: 1,
        storageUsed: file.size,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        filesUploaded: { increment: 1 },
        storageUsed: { increment: file.size },
      },
    });

    return NextResponse.json({
      success: true,
      key,
      url: publicUrl,
      fileName: safeName,
      fileType: safeMimeType,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
