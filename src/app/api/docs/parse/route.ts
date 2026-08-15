import { NextRequest } from "next/server";
import { visionService } from "@/services/VisionService";
import { fail, withApiHandler } from "@/lib/withApiHandler";
import { logger } from "@/lib/logger";
import { validateFile, KNOWLEDGE_ALLOWED_EXTENSIONS } from "@/lib/file-validation";

const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB — the parser reads the whole file into memory

const api = withApiHandler({ rateLimit: { key: "docs", limit: 30, ipLimit: 60 } });

/**
 * POST /api/docs/parse — multipart with `file` field.
 * Extracts text from PDF (pdf-parse) or text-based files. Returns
 * `{ provider: "unavailable" }` when the parser isn't available.
 */
export const POST = async (req: NextRequest) => {
  const authRes = await api.POST(async () => {
    try {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("NO_FILE", "Missing file field", 400);
      if (file.size === 0) return fail("EMPTY_FILE", "File is empty", 400);
      if (file.size > MAX_DOC_SIZE) {
        return fail("PAYLOAD_TOO_LARGE", "File too large (max 10MB)", 413);
      }
      const bytes = await file.arrayBuffer();
      // Content validation: document allowlist + magic-byte/text sniffing.
      const validation = validateFile(file.name, file.type, new Uint8Array(bytes), KNOWLEDGE_ALLOWED_EXTENSIONS);
      if (!validation.ok) {
        return fail("UNSUPPORTED_MEDIA_TYPE", validation.reason, 415);
      }
      const result = await visionService.parseDocument(file.name, bytes);
      return { success: true as const, data: result };
    } catch (error) {
      logger.error("[API] Document parse failed", undefined, error instanceof Error ? error : undefined);
      return fail("PARSE_FAILED", "Document parse failed", 502);
    }
  })(req, { params: Promise.resolve({}) });

  return authRes;
};
