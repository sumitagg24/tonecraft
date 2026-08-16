import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getObject, StorageError, isStorageConfigured } from "@/lib/storage";
import { logger } from "@/lib/logger";

/**
 * GET /api/files/[...key] — private download for an R2 object.
 *
 * Ownership is enforced by key prefix: only `uploads/<userId>/…` and
 * `knowledge/<userId>/…` keys are served, so a caller can never read another
 * user's objects. When R2_PUBLIC_URL is configured, clients use the public URL
 * instead and this route is a fallback for private reads.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  if (!isStorageConfigured()) {
    return new Response("File storage is not configured", { status: 503 });
  }

  const segments = (await params).key;
  if (!segments?.length) {
    return new Response("Not found", { status: 404 });
  }

  const key = segments.join("/");
  const allowedPrefixes = [`uploads/${userId}/`, `knowledge/${userId}/`];
  if (!allowedPrefixes.some((p) => key.startsWith(p))) {
    // Not this user's object — 404 (don't leak existence).
    return new Response("Not found", { status: 404 });
  }

  let object;
  try {
    object = await getObject(key);
  } catch (error) {
    if (error instanceof StorageError && error.status === 404) {
      return new Response("Not found", { status: 404 });
    }
    logger.error("[Files] download failed", { key, error: String(error) });
    return new Response("Download failed", { status: 500 });
  }

  const fileName = decodeURIComponent(key.split("/").pop() ?? "file");
  const isImage = object.contentType.startsWith("image/");
  const isPdf = object.contentType === "application/pdf";
  const inline = isImage || isPdf;

  // Copy into a fresh ArrayBuffer so Blob sees a plain ArrayBuffer (the Node
  // Buffer's ArrayBufferLike isn't a valid BlobPart).
  const arrayBuffer = new Uint8Array(object.body).buffer;

  return new Response(new Blob([arrayBuffer]), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.contentLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
