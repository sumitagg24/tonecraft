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

export function extractText(mimeType: string, buffer: Buffer): string {
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
    css: "text/css",
    js: "text/javascript",
    mjs: "text/javascript",
  };
  return map[ext] ?? "text/plain";
}
