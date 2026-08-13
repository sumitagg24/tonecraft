import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3-compatible file storage (Backblaze B2, Cloudflare R2, or any S3
 * endpoint) — powers chat message attachments only. Storage is optional:
 * the app runs and stays healthy without it.
 *
 * Env vars (see .env.example):
 *   STORAGE_ENDPOINT            e.g. https://s3.us-west-004.backblazeb2.com
 *   STORAGE_REGION              e.g. us-west-004 (B2) or "auto" (R2)
 *   STORAGE_ACCESS_KEY_ID       B2 keyID / R2 Access Key ID
 *   STORAGE_SECRET_ACCESS_KEY   B2 applicationKey / R2 Secret Access Key
 *   STORAGE_BUCKET_NAME         bucket name
 *   STORAGE_PUBLIC_URL          base URL for public files, e.g.
 *                               https://<bucket>.s3.<region>.backblazeb2.com
 */

/** Looks like a placeholder rather than a real credential ("...", "your-..."). */
function isPlaceholder(value: string | undefined): boolean {
  return !value || value.length < 8 || value === "..." || value.startsWith("your-");
}

/**
 * True when a storage backend is actually configured with real-looking values.
 * Credentials must be substantive (≥8 chars); the bucket name may be short
 * (Backblaze B2 allows 3–63 char bucket names).
 */
export function isStorageConfigured(): boolean {
  const credsOk = ![
    "STORAGE_ENDPOINT",
    "STORAGE_ACCESS_KEY_ID",
    "STORAGE_SECRET_ACCESS_KEY",
  ].some((k) => isPlaceholder(process.env[k]));
  const bucket = process.env.STORAGE_BUCKET_NAME;
  const bucketOk = Boolean(bucket && bucket !== "..." && !bucket.startsWith("your-"));
  return credsOk && bucketOk;
}

/**
 * Resolve the S3 region: explicit STORAGE_REGION wins; otherwise derive it
 * from a Backblaze B2 endpoint host (s3.<region>.backblazeb2.com) so SigV4
 * signing never silently fails; fall back to "auto" (Cloudflare R2).
 */
function resolveRegion(endpoint: string): string {
  const explicit = process.env.STORAGE_REGION;
  if (explicit) return explicit;
  const match = endpoint.match(/^https?:\/\/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  return match ? match[1] : "auto";
}

function createStorageClient(): S3Client {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Storage credentials are not configured");
  }

  return new S3Client({
    region: resolveRegion(endpoint),
    endpoint,
    // Path-style addressing is required by Backblaze B2 and supported by
    // Cloudflare R2 — safe for any S3-compatible provider.
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

let _storageClient: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (!_storageClient) {
    _storageClient = createStorageClient();
  }
  return _storageClient;
}
