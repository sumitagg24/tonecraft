import { logger } from "@/lib/logger";

/**
 * Phase 18 — Voice & Multimodal AI.
 *
 * Speech-to-text (transcription) and text-to-speech (synthesis) via an
 * OpenAI-compatible provider when configured; otherwise returns a structured
 * "not configured" result so the UI can show a clear setup state instead of
 * a crash. Provider choice is documented in `.env.example`.
 *
 *   OPENAI_API_KEY → uses the /v1/audio endpoints (whisper + tts).
 */

const CONFIGURED = Boolean(process.env.OPENAI_API_KEY);

function baseUrl() {
  return process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  provider: "openai" | "unavailable";
  durationMs?: number;
}

export interface SynthesisResult {
  audioBase64: string;
  format: "mp3";
  provider: "openai" | "unavailable";
}

export class VoiceService {
  /** Transcribe audio bytes (wav/mp3/ogg/webm). Returns empty text when unconfigured. */
  async transcribe(audio: ArrayBuffer, contentType: string, filename = "audio.webm"): Promise<TranscriptionResult> {
    if (!CONFIGURED) {
      logger.warn("[Voice] transcription skipped — OPENAI_API_KEY not configured");
      return { text: "", provider: "unavailable" };
    }

    const started = Date.now();
    const form = new FormData();
    form.append("file", new Blob([audio], { type: contentType || "audio/webm" }), filename);
    form.append("model", process.env.STT_MODEL ?? "whisper-1");

    const res = await fetch(`${baseUrl()}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      logger.error(`[Voice] transcription failed: ${res.status} ${await res.text().catch(() => "")}`);
      throw new Error("Transcription provider error");
    }
    const data = (await res.json()) as { text: string };
    return {
      text: data.text,
      provider: "openai",
      durationMs: Date.now() - started,
    };
  }

  /** Synthesize speech. Returns base64 mp3; empty payload when unconfigured. */
  async synthesize(text: string, voice = "alloy"): Promise<SynthesisResult> {
    if (!CONFIGURED) {
      logger.warn("[Voice] synthesis skipped — OPENAI_API_KEY not configured");
      return { audioBase64: "", format: "mp3", provider: "unavailable" };
    }

    const res = await fetch(`${baseUrl()}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.TTS_MODEL ?? "tts-1",
        voice: process.env.TTS_VOICE ?? voice,
        input: text.slice(0, 4000),
        format: "mp3",
      }),
    });
    if (!res.ok) {
      logger.error(`[Voice] synthesis failed: ${res.status}`);
      throw new Error("Synthesis provider error");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return { audioBase64: buf.toString("base64"), format: "mp3", provider: "openai" };
  }
}

export const voiceService = new VoiceService();
