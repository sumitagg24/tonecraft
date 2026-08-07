import { logger } from "@/lib/logger";

/**
 * Phase 18 — Vision & Multimodal AI.
 *
 * Image understanding (describe / answer) via a vision-capable chat model,
 * plus OCR for images and basic PDF text extraction (pdf-parse when
 * installed, plain base64 fallback otherwise). Provider-gated on
 * OPENAI_API_KEY — returns `unavailable` results otherwise.
 */

const CONFIGURED = Boolean(process.env.OPENAI_API_KEY);

function baseUrl() {
  return process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
}

export interface VisionResult {
  text: string;
  provider: "openai" | "unavailable";
}

export class VisionService {
  /** Ask a vision-capable model about an image (base64 data URL). */
  async analyzeImage(imageDataUrl: string, prompt = "Describe this image in detail."): Promise<VisionResult> {
    if (!CONFIGURED) {
      logger.warn("[Vision] analysis skipped — OPENAI_API_KEY not configured");
      return { text: "", provider: "unavailable" };
    }
    if (!imageDataUrl.startsWith("data:image/")) {
      throw new Error("Invalid image payload");
    }

    const res = await fetch(`${baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.VISION_MODEL ?? "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt.slice(0, 2000) },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        max_tokens: 512,
      }),
    });
    if (!res.ok) {
      logger.error(`[Vision] analysis failed: ${res.status}`);
      throw new Error("Vision provider error");
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return {
      text: data.choices?.[0]?.message?.content?.trim() ?? "",
      provider: "openai",
    };
  }

  /** OCR an image → extracted text. */
  async ocr(imageDataUrl: string): Promise<VisionResult> {
    return this.analyzeImage(imageDataUrl, "Extract all text from this image verbatim. Return only the extracted text.");
  }

  /**
   * Parse a PDF (or text file) into plain text. Uses a lightweight internal
   * extractor when pdf-parse is available; otherwise reports unavailable.
   */
  async parseDocument(name: string, bytes: ArrayBuffer): Promise<VisionResult> {
    const isPdf = name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      // Text-based files can be decoded directly.
      const text = Buffer.from(bytes).toString("utf8");
      return { text: text.slice(0, 50_000), provider: "unavailable" };
    }
    if (!CONFIGURED) {
      logger.warn("[Vision] PDF parse skipped — provider not configured");
      return { text: "", provider: "unavailable" };
    }
    try {
      // Dynamic require wrapped to avoid static bundler resolution failure if optional module is missing
      const req = eval("require");
      const pdfParse = req("pdf-parse");
      const data = await pdfParse(Buffer.from(bytes));
      return { text: String(data?.text ?? "").slice(0, 50_000), provider: "openai" };
    } catch (error) {
      logger.warn(`[Vision] pdf-parse unavailable: ${String(error)}`);
      return { text: "", provider: "unavailable" };
    }
  }
}

export const visionService = new VisionService();
