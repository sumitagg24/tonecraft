import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { voiceService } from "@/services/VoiceService";
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
    return fail("SYNTHESIS_FAILED", error instanceof Error ? error.message : "Synthesis failed", 502);
  }
});
