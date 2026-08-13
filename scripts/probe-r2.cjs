/* Probe S3-compatible storage (Backblaze B2 / Cloudflare R2) with the same
 * client config the app uses. Loads .env.local. */
const fs = require("fs");
const path = require("path");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

// Minimal .env.local loader
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const endpoint = env.STORAGE_ENDPOINT || process.env.STORAGE_ENDPOINT;
const region = env.STORAGE_REGION || process.env.STORAGE_REGION || "auto";
const accessKeyId = env.STORAGE_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = env.STORAGE_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
const bucket = env.STORAGE_BUCKET_NAME || process.env.STORAGE_BUCKET_NAME;

console.log("endpoint set:", !!endpoint, "| region:", region, "| accessKey set:", !!accessKeyId, "| secret set:", !!secretAccessKey, "| bucket:", bucket);

if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
  console.log("MISSING STORAGE CREDENTIALS");
  process.exit(2);
}

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

(async () => {
  try {
    const res = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
    console.log("STORAGE HEALTHY — bucket reachable, contents:", res.Contents?.length ?? 0);
  } catch (e) {
    console.log("STORAGE FAILED:", e.name, "|", e.message, "|", e.Code ? "Code=" + e.Code : "");
    process.exit(1);
  }
})();
