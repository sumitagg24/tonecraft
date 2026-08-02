/**
 * File upload validation — never trust client-supplied MIME or extension alone.
 *
 * Strategy:
 *  1. Extension allowlist per route (upload vs knowledge).
 *  2. Magic-byte sniffing for binary types (images, pdf, audio).
 *  3. NUL-free printable check for text types (text/*, json, xml, js) —
 *     rejects binary masquerading as text and vice versa.
 */

export type FileValidation =
  | { ok: true; mime: string }
  | { ok: false; reason: string };

const UPLOAD_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "txt", "html", "css", "js", "json", "xml",
  "mp3", "wav",
]);

/** Knowledge ingestion is deliberately narrower (document formats only). */
const KNOWLEDGE_EXTENSIONS = new Set([
  "pdf", "txt", "md", "markdown", "html", "json", "xml", "csv",
]);

export const DEFAULT_ALLOWED_EXTENSIONS: ReadonlySet<string> = UPLOAD_EXTENSIONS;
export const KNOWLEDGE_ALLOWED_EXTENSIONS: ReadonlySet<string> = KNOWLEDGE_EXTENSIONS;

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "";
}

/** Canonical sniffed MIME for known binary magic numbers. */
const MAGIC: ReadonlyArray<{ mime: string; test: (b: Uint8Array) => boolean }> = [
  {
    mime: "image/jpeg",
    test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    test: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    test: (b) => b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
  {
    mime: "image/webp",
    test: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: "application/pdf",
    test: (b) => b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
  {
    mime: "audio/mpeg",
    test: (b) =>
      (b.length >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || // ID3
      (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0), // MPEG frame sync
  },
  {
    mime: "audio/wav",
    test: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45,
  },
];

/** Declared MIME families that are considered "text" for validation purposes. */
const TEXT_MIMES = new Set([
  "text/plain",
  "text/html",
  "text/css",
  "text/markdown",
  "text/csv",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
]);

const BINARY_FAMILIES = new Set(["image", "audio", "pdf"]);

/** Equivalent subtype spellings browsers/clients commonly send. */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "audio/mp3": "audio/mpeg",
  "application/x-javascript": "application/javascript",
  "text/x-markdown": "text/markdown",
};

function normalizeMime(mime: string): string {
  return MIME_ALIASES[mime.toLowerCase()] ?? mime.toLowerCase();
}

function isTextLike(buf: Uint8Array): boolean {
  if (buf.length === 0) return true;
  const sample = buf.subarray(0, Math.min(buf.length, 2048));
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    if (c === 0) return false; // NUL byte → binary
    if ((c >= 9 && c <= 13) || (c >= 32 && c <= 126) || c >= 128) printable++;
  }
  return printable / sample.length > 0.9;
}

/** Return the sniffed canonical MIME, or "application/octet-stream" when unknown. */
export function sniffMimeType(buf: Uint8Array): string {
  for (const { mime, test } of MAGIC) {
    if (test(buf)) return mime;
  }
  return isTextLike(buf) ? "text/plain" : "application/octet-stream";
}

function familyOf(mime: string): "image" | "audio" | "pdf" | "text" | "other" {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (TEXT_MIMES.has(m) || m.startsWith("text/")) return "text";
  return "other";
}

/**
 * Validate an upload against the allowlist + content sniffing.
 * - allowedExtensions: extension allowlist for this route.
 * - The declared MIME must fall in a supported family (image/audio/pdf/text).
 * - Binary families require a magic-byte match.
 * - Text families reject binary content (NUL / non-printable).
 * - Empty declared MIME ("") is treated as unknown and validated purely by sniff.
 */
export function validateFile(
  name: string,
  declaredMime: string,
  buffer: Uint8Array,
  allowedExtensions: ReadonlySet<string> = DEFAULT_ALLOWED_EXTENSIONS,
): FileValidation {
  const ext = getExtension(name);
  if (!ext || !allowedExtensions.has(ext)) {
    return { ok: false, reason: "File extension not allowed" };
  }

  if (buffer.length === 0) {
    return { ok: false, reason: "File is empty" };
  }

  const declared = normalizeMime(declaredMime || "application/octet-stream");
  const declaredFamily = familyOf(declared);
  const sniffed = sniffMimeType(buffer);
  const sniffedFamily = familyOf(sniffed);

  // Unknown declared MIME → rely entirely on the sniffed content.
  if (declared === "application/octet-stream") {
    if (sniffedFamily === "other") {
      return { ok: false, reason: "File content is not a supported type" };
    }
    return { ok: true, mime: sniffed };
  }

  // Binary families must match their magic bytes — exact subtype when the
  // sniffed type is known (a .png containing JPEG bytes is rejected).
  if (BINARY_FAMILIES.has(declaredFamily)) {
    if (sniffedFamily !== declaredFamily) {
      return { ok: false, reason: "File content does not match its declared type" };
    }
    if (sniffed !== "application/octet-stream" && normalizeMime(sniffed) !== declared) {
      return { ok: false, reason: "File content does not match its declared type" };
    }
    return { ok: true, mime: sniffed };
  }

  // Text families must not contain binary content.
  if (declaredFamily === "text") {
    if (sniffedFamily === "other") {
      return { ok: false, reason: "File content is not a supported type" };
    }
    return { ok: true, mime: sniffed };
  }

  return { ok: false, reason: "File type not allowed" };
}
