import { ok, fail, withApiHandler } from "@/lib/withApiHandler";
import { planService } from "@/services/PlanService";
import { checkMessageLimit } from "@/lib/ratelimit";
import { runAi } from "@/services/ai-assist";
import { z } from "zod";
import type { Intent, Tone } from "@/engine/types";

const assistSchema = z.object({
  action: z.enum([
    "rewrite",
    "summarize",
    "expand",
    "grammar",
    "tone",
    "continue",
    "plan",
    "research",
    "meeting_notes",
  ]),
  text: z.string().min(1).max(30000),
  tone: z.string().max(40).optional(),
  extra: z.string().max(2000).optional(),
});

// Phase 12.4 — per-endpoint (20/min) + IP ceiling on top of plan-based caps.
const api = withApiHandler({ schema: assistSchema, rateLimit: { key: "ai-assist", limit: 20, ipLimit: 120 } });

const ROLES: Record<string, string> = {
  rewrite: "You are a world-class editor. Rewrite the text to be clearer, sharper, and more engaging while preserving meaning and the author's voice.",
  summarize: "You are a precise summarizer. Return a concise summary that preserves all key points, decisions, and numbers.",
  expand: "You are a skilled writer. Expand the text with richer detail, concrete examples, and smoother transitions.",
  grammar: "You are a meticulous proofreader. Fix grammar, spelling, punctuation, and awkward phrasing. Return only the corrected text.",
  tone: "You are an expert in tone and voice. Rewrite the text to match the requested tone while keeping the original meaning.",
  continue: "You are a writer continuing someone else's draft. Continue naturally from where the text ends, matching its style and voice.",
  plan: "You are an AI planning engine. Produce a clear, actionable, step-by-step plan with phases, owners, and success criteria.",
  research: "You are a deep research agent. Analyze the topic systematically: key facts, opposing viewpoints, evidence, and a bottom-line summary. Cite reasoning clearly and flag uncertainty.",
  meeting_notes: "You are a meeting assistant. Convert the raw transcript into structured meeting notes: attendees, decisions, action items (with owners), and open questions.",
};

const INTENTS: Record<string, Intent> = {
  rewrite: "rewrite",
  summarize: "summarize",
  expand: "enhance",
  grammar: "grammar",
  tone: "rewrite",
  continue: "custom",
  plan: "custom",
  research: "custom",
  meeting_notes: "custom",
};

const TONES: Record<string, Tone | undefined> = {
  professional: "professional",
  friendly: "friendly",
  casual: "casual",
  formal: "formal",
  funny: "funny",
  sarcastic: "sarcastic",
  polite: "polite",
  romantic: "romantic",
  creative: "creative",
};

export const POST = api.POST(async (ctx, body) => {
  const { action, text, tone, extra } = body as typeof assistSchema._output;

  const plan = await planService.getPlan(ctx.user.id);
  const limit = await checkMessageLimit(ctx.user.id, plan.tier);
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Rate limit exceeded", 429, {
      limit: limit.limit,
      window: limit.window,
      remaining: limit.remaining,
    });
  }

  let prompt: string;
  switch (action) {
    case "tone":
      prompt = `Rewrite the following text in a ${tone ?? "professional"} tone:\n\n${text}`;
      break;
    case "plan":
      prompt = `Create a detailed plan for: ${extra?.trim() || text}`;
      break;
    case "research":
      prompt = `Research topic: ${extra?.trim() || text}`;
      break;
    case "meeting_notes":
      prompt = `Transcript:\n\n${text}`;
      break;
    default:
      prompt = text;
  }

  try {
    const result = await runAi(prompt, ctx.user.id, {
      role: ROLES[action],
      intent: INTENTS[action],
      tone: TONES[tone ?? ""],
    });
    return ok(result);
  } catch (error) {
    return fail(
      "AI_ACTION_FAILED",
      error instanceof Error ? error.message : "AI action failed",
      400
    );
  }
});
