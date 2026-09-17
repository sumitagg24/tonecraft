/**
 * ToneCraft extension — generation orchestration (service worker).
 *
 * Maps validated extension tools onto the EXISTING backend routes:
 *  - backend.kind "tools"  → POST /api/tools   {toolId, input, tone?, language?, length?, …}
 *  - backend.kind "assist" → POST /api/ai/assist {action, text, tone?, extra?}
 *
 * All policy (auth, plan caps, rate limits, input validation, provider
 * failover) stays server-side. This layer only validates shapes, wires
 * cancellation, and normalizes failures to ExtensionError.
 */
import { apiClient } from "./apiClient";
import { TOOL_BY_ID, LIMITS } from "../shared/constants";
import { EXTENSION_TONES } from "../shared/constants";
import type { GenerateRequest, GenerateResult } from "../shared/types";
import { ExtensionError } from "../shared/errors";
import { pushRecent } from "../shared/storage";

interface ToolsPayload {
  content: string;
}

function toneToolId(tone: string | undefined, fallback: string): string {
  if (!tone) return fallback;
  const found = EXTENSION_TONES.find((t) => t.id === tone.toLowerCase());
  return found ? found.toolId : fallback;
}

export async function generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
  const tool = TOOL_BY_ID[req.toolId];
  if (!tool) throw new ExtensionError("BAD_INPUT");

  const input = req.input.trim().slice(0, LIMITS.maxSelectionChars);
  if (!input) throw new ExtensionError("BAD_INPUT");

  const instructions = (req.instructions ?? "").trim().slice(0, LIMITS.maxInstructionsChars);

  let content: string;
  if (tool.backend.kind === "tools") {
    const payload: Record<string, unknown> = {
      toolId: tool.backend.toolId,
      input,
      ...(tool.backend.extra ?? {}),
    };
    if (tool.needsTone && req.tone) payload.tone = req.tone;
    if (tool.needsLanguage && req.language) payload.language = req.language.trim().slice(0, 60);
    if (req.length) payload.length = req.length;
    if (instructions) payload.audience = instructions;
    const data = await apiClient.post<ToolsPayload>("/api/tools", payload, { signal });
    content = data.content;
  } else {
    const action = tool.backend.assistAction ?? "rewrite";
    let tone = req.tone;
    // "Change tone" via a direct-tone toolId is sharper than the generic
    // assist tone path — prefer the dedicated rewrite tool when available.
    if (tool.id === "tone" && tone) {
      const directId = toneToolId(tone, "");
      if (directId) {
        const data = await apiClient.post<ToolsPayload>(
          "/api/tools",
          { toolId: directId, input, ...(instructions ? { audience: instructions } : {}) },
          { signal },
        );
        content = data.content;
      } else {
        const data = await apiClient.post<string>("/api/ai/assist", {
          action: "tone",
          text: input,
          tone,
          ...(instructions ? { extra: instructions } : {}),
        }, { signal });
        content = data;
      }
    } else {
      const data = await apiClient.post<string>("/api/ai/assist", {
        action,
        text: input,
        ...(tone ? { tone } : {}),
        ...(instructions ? { extra: instructions } : {}),
      }, { signal });
      content = data;
    }
  }

  if (typeof content !== "string" || !content.trim()) {
    throw new ExtensionError("SERVER");
  }
  const trimmed = content.trim();

  await pushRecent({ toolId: tool.id, at: Date.now(), inputChars: input.length, outputChars: trimmed.length });

  return { requestId: req.requestId, toolId: tool.id, content: trimmed };
}
