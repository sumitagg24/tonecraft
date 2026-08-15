import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { visionService } from "@/services/VisionService";
import { logger } from "@/lib/logger";
import { z } from "zod";

const analyzeSchema = z.object({
  image: z.string().max(15_000_000), // data URL
  prompt: z.string().max(2000).optional(),
});

const api = withApiHandler({ rateLimit: { key: "vision", limit: 30 } });

// POST /api/vision/analyze
export const POST = api.POST(async (ctx, body) => {
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid image payload", 400);
  try {
    const result = await visionService.analyzeImage(parsed.data.image, parsed.data.prompt);
    return ok(result);
  } catch (error) {
    logger.error("[API] Vision analysis failed", { userId: ctx.user.id }, error instanceof Error ? error : undefined);
    return fail("VISION_FAILED", "Vision analysis failed", 502);
  }
});
