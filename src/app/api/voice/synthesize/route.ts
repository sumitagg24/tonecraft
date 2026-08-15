import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { voiceService } from "@/services/VoiceService";
import { logger } from "@/lib/logger";
import { z } from "zod";

const synthSchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().max(40).optional(),
});

const api = withApiHandler({ rateLimit: { key: "voice", limit: 20 } });

// POST /api/voice/synthesize
export const POST = api.POST(async (ctx, body) => {
  const parsed = synthSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid synthesis payload", 400);
  try {
    const result = await voiceService.synthesize(parsed.data.text, parsed.data.voice);
    return ok(result);
  } catch (error) {
    logger.error("[API] Voice synthesis failed", { userId: ctx.user.id }, error instanceof Error ? error : undefined);
    return fail("SYNTHESIS_FAILED", "Synthesis failed", 502);
  }
});
