import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/request-ip";
import { checkDemoLimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

// ── Transform logic (mirrors client-side functions exactly) ──────────

type ToneId = "professional" | "friendly" | "funny" | "creative" | "minimal" | "slang";
type ActionId =
  | "twitter" | "threads" | "linkedin" | "email" | "instagram"
  | "reddit" | "shorten" | "expand" | "professional" | "funny";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function rewrite(input: string, tone: ToneId): string {
  const t = input.trim();
  if (!t) return "";
  switch (tone) {
    case "professional":
      return `${capitalize(
        t
          .replace(/\bcan't\b/gi, "cannot")
          .replace(/\bgonna\b/gi, "going to")
          .replace(/\bwanna\b/gi, "want to")
          .replace(/\b(u)\b/gi, "you")
      )}\n\nI trust this clarifies the situation — happy to discuss further at your convenience.`;
    case "friendly":
      return `Hey! ${capitalize(t)}\n\nLet me know if that works for you — happy to help!`;
    case "funny":
      return `${capitalize(t)} — and yes, I'm only 90% joking.`;
    case "creative":
      return `${capitalize(t)}\n\nPicture this unfolding exactly the way I mean it.`;
    case "minimal":
      return `${capitalize(t).replace(/[?!.]+$/g, "").replace(/[,\s]+/g, " ").trim()}.`;
    case "slang":
      return `${capitalize(t)}\n\nfr fr, no cap — raincheck?`;
  }
}

function applyAction(input: string, action: ActionId): string {
  const t = input.trim().replace(/[.!?]+$/, "");
  if (!t) return "";
  switch (action) {
    case "twitter":
      return `${t.slice(0, 240)}…\n\nWhat's your take? 👇\n#ToneCraft`;
    case "threads":
      return `${t} — no cap, this has been on my mind all week. What do you think?`;
    case "linkedin":
      return `${capitalize(t)}\n\nI've been reflecting on this a lot lately — the words we choose genuinely shape how we're heard. Curious what your experience has been.\n\n#Communication #ToneCraft`;
    case "email":
      return `Subject: A quick update — ${t.slice(0, 42)}…\n\nHi there,\n\n${t}. I wanted to share this with you and see what you think.\n\nBest regards,\n[Your name]`;
    case "instagram":
      return `${t} ✨\n\nSave this for later — trust me.\n\n#DailyPost #Motivation #ToneCraft`;
    case "reddit":
      return `**${t}**\n\n(Context: this came up in a conversation and I'd love a second opinion. What would you do?)`;
    case "shorten":
      return t.split(/[.!?]+/)[0] + ".";
    case "expand":
      return `${t}. More specifically, the details matter here: the timing, the audience, and the exact wording all change how the message lands — which is exactly why having the right version ready matters.`;
    case "professional":
      return `${capitalize(t)}.\n\nI trust this provides the clarity you need — happy to discuss further at your convenience.`;
    case "funny":
      return `${t} — and yes, I'm only 90% joking. The other 10% is fully committed.`;
  }
}

// ── Route handler ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Server-side rate limit: 3 per IP per 24 hours
    const limit = await checkDemoLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DEMO_LIMIT_REACHED",
            message: "You've used all 3 free demo transformations. Sign up to continue.",
          },
          remaining: 0,
          limit: limit.limit,
        },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.input !== "string" || !body.input.trim()) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Input text is required" } },
        { status: 400 },
      );
    }

    const input = body.input.trim();
    if (input.length > 2000) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Input too long (max 2000 characters)" } },
        { status: 400 },
      );
    }

    let result: string;

    if (body.action && typeof body.action === "string") {
      // Quick action transform
      result = applyAction(input, body.action as ActionId);
    } else if (body.tone && typeof body.tone === "string") {
      // Tone rewrite
      result = rewrite(input, body.tone as ToneId);
    } else {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Either 'tone' or 'action' is required" } },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { result },
      remaining: limit.remaining,
      limit: limit.limit,
    });
  } catch (err) {
    logger.error("Demo transform error", { error: (err as Error).message });
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}
