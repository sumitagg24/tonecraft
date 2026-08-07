import type { EngineOptions, EngineStreamEvent, EngineResult, ProviderResult } from "./types";

/**
 * Built-in ToneCraft Local Tone Transformer Engine.
 * Formats, rewrites, and adapts text into target tones and platform layouts
 * locally whenever external cloud LLM providers are unconfigured or unavailable.
 */
export class LocalToneEngine {
  async transform(options: EngineOptions): Promise<ProviderResult> {
    const text = options.prompt || "Hello world";
    const tone = (options.tone || "professional").toLowerCase();
    const platform = (options.platform || "general").toLowerCase();

    const transformed = this.applyToneTransformation(text, tone, platform);

    return {
      content: transformed,
      model: "tonecraft-local-v1",
      provider: "tonecraft-local",
      tokens: transformed.split(/\s+/).length,
      latency: 120,
    };
  }

  async *stream(options: EngineOptions): AsyncGenerator<EngineStreamEvent> {
    const result = await this.transform(options);
    const words = result.content.split(" ");

    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i === words.length - 1 ? "" : " ");
      yield { type: "token", content: chunk };
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    yield {
      type: "done",
      result: {
        content: result.content,
        model: "tonecraft-local-v1",
        provider: "tonecraft-local",
        tokens: words.length,
        latency: 150,
        metadata: {
          intent: options.intent || "rewrite",
          tone: options.tone || "professional",
          platform: options.platform,
          generatedAt: new Date().toISOString(),
          model: "tonecraft-local-v1",
          provider: "tonecraft-local",
          tokens: words.length,
          latency: 150,
        },
      },
    };
  }

  private applyToneTransformation(text: string, tone: string, platform: string): string {
    const cleaned = text.trim();

    // Base tone rewrites
    let body = "";

    switch (tone) {
      case "professional":
      case "formal":
      case "corporate":
        body = `Dear Team,\n\nI am writing to share an update regarding our recent progress. ${this.capitalize(cleaned)}. We remain focused on delivering exceptional quality and maintaining clear alignment across all deliverables.\n\nPlease let me know if you would like to discuss further or have any questions.`;
        break;

      case "executive":
      case "ceo":
        body = `**Executive Summary**\n\n• Key Objective: ${cleaned}\n• Strategic Status: On track with high operational focus.\n• Action Required: Review updates and confirm alignment for Q3 execution.`;
        break;

      case "friendly":
      case "polite":
        body = `Hey there! 😊\n\nHope you're having a great day! I wanted to touch base on this: ${cleaned}. Let me know what you think when you get a chance, and we can catch up soon!`;
        break;

      case "creative":
      case "romantic":
        body = `✨ *Crafted Perspective*\n\nImagine taking a moment to look at this in a new light: ${cleaned}. Every detail contributes to a richer story, blending clarity with inspired expression.`;
        break;

      case "luxury":
        body = `*Excellence Defined*\n\nRefined, deliberate, and understated: ${cleaned}. Crafted with precision for those who appreciate true editorial mastery.`;
        break;

      case "funny":
      case "sarcastic":
        body = `Here's the honest take: ${cleaned} 😅. Not to state the obvious, but sometimes keeping things straight to the point saves everyone an extra meeting!`;
        break;

      case "genz":
      case "slang":
      case "casual":
        body = `no cap, here's the vibe: ${cleaned.toLowerCase()} 🔥. lowkey super clean and ready to send. let me know if we're locked in!`;
        break;

      case "academic":
        body = `**Abstract Analysis**\n\nThe following synthesis examines the underlying parameters of the proposition: "${cleaned}". Empirical observation demonstrates that structured clarity optimizes message delivery.`;
        break;

      case "minimal":
      case "direct":
        body = `• ${cleaned}\n• Status: Ready\n• Next steps: Proceed`;
        break;

      default:
        body = `${cleaned}\n\n[Tone Applied: ${this.capitalize(tone)}]`;
        break;
    }

    // Platform adaptors
    if (platform === "linkedin") {
      return `🚀 **ToneCraft Insights**\n\n${body}\n\n---\n#Communication #AI #ToneCraft #Leadership`;
    } else if (platform === "email") {
      return `Subject: Update — ${cleaned.slice(0, 45)}...\n\n${body}\n\nBest regards,\n[Your Name]`;
    } else if (platform === "slack" || platform === "whatsapp") {
      return `${body}`;
    } else if (platform === "twitter") {
      return `${body.slice(0, 260)}\n\n🧵 1/1 #ToneCraft`;
    }

    return body;
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export const localToneEngine = new LocalToneEngine();
