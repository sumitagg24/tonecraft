import { PDFParse } from "pdf-parse";
import { logger } from "@/lib/logger";

export const SUPPORTED_TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "application/xml",
  "text/css",
  "text/javascript",
]);

/**
 * Thrown when a PDF can't be parsed (corrupt/encrypted/scanned). The route
 * catches this to return a 4xx with the user-visible message instead of a
 * generic 500.
 */
export class PdfParseError extends Error {
  constructor() {
    super(
      "Unable to read this PDF — it may be corrupted, password-protected, or contain only scanned images."
    );
    this.name = "PdfParseError";
  }
}

/**
 * Extract plain text from a file buffer. Async because binary formats (PDF)
 * are parsed with pdf-parse. Text formats are decoded synchronously under the
 * hood. Throws on unparseable PDFs so callers fail loudly instead of indexing
 * empty text.
 */
export async function extractText(mimeType: string, buffer: Buffer): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(buffer);
  }

  const text = buffer.toString("utf-8");

  if (mimeType === "application/json") {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }

  if (mimeType === "text/html" || mimeType === "application/xml") {
    return text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return text.replace(/\r\n/g, "\n").trim();
}

/** Parse a PDF into plain text via pdf-parse (pdf.js). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  let text = "";
  try {
    // Pass a copy so the pdf.js worker doesn't detach the caller's buffer
    // (Uint8Array.from copies element-wise; new Uint8Array(buf) is just a view).
    const parser = new PDFParse({ data: Uint8Array.from(buffer) });
    const result = await parser.getText();
    text = result.text ?? "";
  } catch (error) {
    logger.warn("[Knowledge] PDF parse failed", { error: String(error) });
    throw new PdfParseError();
  }

  const cleaned = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (cleaned.length === 0) {
    throw new PdfParseError();
  }
  return cleaned;
}

export function detectMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    xml: "application/xml",
    pdf: "application/pdf",
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
  };
  return map[ext] ?? "text/plain";
}
