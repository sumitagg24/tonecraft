import { NextRequest } from "next/server";
import { visionService } from "@/services/VisionService";
import { fail, withApiHandler } from "@/lib/withApiHandler";

const api = withApiHandler({ rateLimit: { key: "docs", limit: 30 } });

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
      const bytes = await file.arrayBuffer();
      const result = await visionService.parseDocument(file.name, bytes);
      return { success: true as const, data: result };
    } catch (error) {
      return fail("PARSE_FAILED", error instanceof Error ? error.message : "Document parse failed", 502);
    }
  })(req, { params: Promise.resolve({}) });

  return authRes;
};
