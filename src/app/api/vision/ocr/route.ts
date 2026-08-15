import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { visionService } from "@/services/VisionService";
import { logger } from "@/lib/logger";
import { z } from "zod";

const ocrSchema = z.object({
  image: z.string().max(15_000_000),
});

const api = withApiHandler({ rateLimit: { key: "vision", limit: 30 } });

// POST /api/vision/ocr
export const POST = api.POST(async (ctx, body) => {
  const parsed = ocrSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid image payload", 400);
  try {
    const result = await visionService.ocr(parsed.data.image);
    return ok(result);
  } catch (error) {
    logger.error("[API] OCR failed", { userId: ctx.user.id }, error instanceof Error ? error : undefined);
    return fail("OCR_FAILED", "OCR failed", 502);
  }
});
