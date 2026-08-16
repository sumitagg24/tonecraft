import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";

/**
 * Cloudflare R2 object storage (S3-compatible API).
 *
 * Env contract (fail-closed when incomplete):
 *   R2_ACCOUNT_ID         — Cloudflare account id (bucket lives under it)
 *   R2_ACCESS_KEY_ID      — R2 API token access key
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET             — bucket name
 *   R2_PUBLIC_URL         — optional public base URL (e.g. https://files.tonecraft.app)
 *                           used for direct-read links; when unset, downloads go
 *                           through /api/files (signed-in, ownership-checked).
 *
 * Objects are namespaced by owner so API routes can enforce ownership by key
 * prefix: `uploads/<userId>/…`, `knowledge/<userId>/…`.
 */

const REQUIRED_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
] as const;

export type StorageConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string | null;
};

export function readStorageConfig(): StorageConfig | null {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return null;
  }
  // All required vars verified present above — safe to read without assertions.
  return {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
    publicUrl: process.env.R2_PUBLIC_URL?.trim() || null,
  };
}

export function isStorageConfigured(): boolean {
  return readStorageConfig() !== null;
}

let clientCache: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (clientCache) return clientCache;
  const config = readStorageConfig();
  if (!config) return null;
  clientCache = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return clientCache;
}

/** Sanitize a file name for use inside an object key (keep extension). */
export function sanitizeObjectName(name: string): string {
  const base = name.replace(/[^\w.\- ]+/g, "").trim().replace(/\s+/g, "-");
  return base.slice(0, 120) || "file";
}

/** Public URL for an object, or null when no public base is configured. */
export function publicUrl(key: string): string | null {
  const config = readStorageConfig();
  if (!config?.publicUrl) return null;
  return `${config.publicUrl.replace(/\/+$/, "")}/${key}`;
}

export interface UploadObjectInput {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}

export interface StoredObject {
  key: string;
  url: string | null;
}

/**
 * Upload an object to R2. Returns the key + a public URL when one is
 * configured. Throws StorageError when R2 isn't configured or the upload fails.
 */
export async function uploadObject(input: UploadObjectInput): Promise<StoredObject> {
  const client = getS3Client();
  const config = readStorageConfig();
  if (!client || !config) {
    throw new StorageError("File storage is not configured");
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      })
    );
  } catch (error) {
    logger.error("[Storage] upload failed", { key: input.key, error: String(error) });
    throw new StorageError("Upload failed");
  }
  return { key: input.key, url: publicUrl(input.key) };
}

/** Delete an object. Best-effort — missing objects are treated as success. */
export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  const config = readStorageConfig();
  if (!client || !config) return;
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
    );
  } catch (error) {
    logger.warn("[Storage] delete failed", { key, error: String(error) });
  }
}

export interface StoredObjectData {
  body: Buffer;
  contentType: string;
  contentLength: number;
}

/** Download an object's bytes. Throws StorageError when missing or unconfigured. */
export async function getObject(key: string): Promise<StoredObjectData> {
  const client = getS3Client();
  const config = readStorageConfig();
  if (!client || !config) {
    throw new StorageError("File storage is not configured");
  }
  let response;
  try {
    response = await client.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: key })
    );
  } catch (error) {
    logger.warn("[Storage] get failed", { key, error: String(error) });
    throw new StorageError("File not found", 404);
  }
  if (!response.Body) {
    throw new StorageError("File not found", 404);
  }
  const bytes = await response.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
    contentLength: response.ContentLength ?? bytes.length,
  };
}

export class StorageError extends Error {
  readonly status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = "StorageError";
    this.status = status;
  }
}
