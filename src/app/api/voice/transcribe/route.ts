import { NextRequest } from "next/server";
import { voiceService } from "@/services/VoiceService";
import { fail, withApiHandler } from "@/lib/withApiHandler";

const api = withApiHandler({ rateLimit: { key: "voice", limit: 20 } });

/**
 * POST /api/voice/transcribe — multipart/form-data with `audio` file field.
 * Returns transcribed text, or `{ provider: "unavailable" }` when no
 * OPENAI_API_KEY is configured (UI shows a setup prompt).
 */
export const POST = async (req: NextRequest) => {
  const authRes = await api.POST(async () => {
    try {
      const form = await req.formData();
      const file = form.get("audio");
      if (!(file instanceof File)) return fail("NO_AUDIO", "Missing audio file field", 400);
      const bytes = await file.arrayBuffer();
      const result = await voiceService.transcribe(bytes, file.type, file.name);
      return { success: true as const, data: result };
    } catch (error) {
      return fail("TRANSCRIBE_FAILED", error instanceof Error ? error.message : "Transcription failed", 502);
    }
  })(req, { params: Promise.resolve({}) });

  return authRes;
};
