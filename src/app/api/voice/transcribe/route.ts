import { NextRequest } from "next/server";
import { voiceService, VoiceConfigError } from "@/services/VoiceService";
import { fail, withApiHandler } from "@/lib/withApiHandler";
import { logger } from "@/lib/logger";
import { sniffMimeType } from "@/lib/file-validation";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB — whisper's per-file ceiling

/** Audio extensions accepted from the composer's MediaRecorder / uploads. */
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "webm", "ogg", "oga", "m4a", "opus"]);

function isAudio(name: string, declaredMime: string, buffer: Uint8Array): boolean {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : "";
  if (AUDIO_EXTENSIONS.has(ext)) return true;
  if (declaredMime.toLowerCase().startsWith("audio/")) return true;
  return sniffMimeType(buffer).startsWith("audio/");
}

const api = withApiHandler({ rateLimit: { key: "voice", limit: 20, ipLimit: 60 } });

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
      if (file.size === 0) return fail("EMPTY_FILE", "Audio file is empty", 400);
      if (file.size > MAX_AUDIO_SIZE) {
        return fail("PAYLOAD_TOO_LARGE", "Audio file too large (max 25MB)", 413);
      }
      const bytes = await file.arrayBuffer();
      // Reject non-audio payloads (extension / declared MIME / magic bytes).
      if (!isAudio(file.name, file.type, new Uint8Array(bytes))) {
        return fail("UNSUPPORTED_MEDIA_TYPE", "File is not a supported audio type", 415);
      }
      const result = await voiceService.transcribe(bytes, file.type, file.name);
      return { success: true as const, data: result };
    } catch (error) {
      logger.error("[API] Transcription failed", undefined, error instanceof Error ? error : undefined);
      // Provider-key problems get a curated, safe hint — never raw provider
      // error text. Everything else stays generic.
      if (error instanceof VoiceConfigError) {
        return fail("PROVIDER_CONFIG", error.message, 502);
      }
      return fail("TRANSCRIBE_FAILED", "Transcription failed", 502);
    }
  })(req, { params: Promise.resolve({}) });

  return authRes;
};
