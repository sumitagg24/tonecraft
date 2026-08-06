import type { ConversationMessage, IntentConfig, ModelMessage, Tone } from "./types";

export interface ContextSource {
  history?: ConversationMessage[];
  currentMessage?: string;
  preferences?: {
    language?: string;
    tone?: string;
    platform?: string;
    style?: string;
    creativity?: number;
    length?: string;
    streaming?: boolean;
  };
  persona?: {
    name?: string;
    systemPrompt?: string;
    tone?: string;
    writingStyle?: string;
    emojiUsage?: string;
    temperature?: number | null;
  };
  knowledge?: {
    systemBlock?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface BuiltContext {
  systemMessage: string;
  messages: ModelMessage[];
  config: IntentConfig;
}

export class ContextBuilder {
  build(source: ContextSource, config: IntentConfig): BuiltContext {
    const systemParts: string[] = [];

    // Persona
    if (source.persona?.systemPrompt) {
      systemParts.push(source.persona.systemPrompt);
    }

    // Tone
    const tone = source.persona?.tone || config.tone || source.preferences?.tone || "professional";
    systemParts.push(this.getToneDescription(tone as Tone));

    // Style
    const style = source.persona?.writingStyle || source.preferences?.style || "standard";
    if (style !== "standard") {
      systemParts.push(`Writing style: ${style}`);
    }

    // Persona emoji usage
    if (source.persona?.emojiUsage && source.persona.emojiUsage !== "none") {
      const emojiMap: Record<string, string> = {
        subtle: "Use emojis sparingly.",
        moderate: "Use emojis moderately.",
        heavy: "Use emojis liberally.",
      };
      systemParts.push(`Emoji: ${emojiMap[source.persona.emojiUsage] || ""}`);
    }

    // Knowledge grounding
    if (source.knowledge?.systemBlock) {
      systemParts.push(source.knowledge.systemBlock);
    }

    // User preferences
    if (source.preferences?.language) {
      systemParts.push(`Language: ${source.preferences.language}`);
    }

    // Context config
    const contextLines: string[] = [];
    if (config.platform) contextLines.push(`Platform: ${config.platform}`);
    if (config.audience) contextLines.push(`Audience: ${config.audience}`);
    if (config.length) contextLines.push(`Length: ${config.length}`);
    if (config.formality) contextLines.push(`Formality: ${config.formality}`);
    if (config.creativity !== undefined) contextLines.push(`Creativity: ${config.creativity}/100`);
    if (config.emojiLevel !== undefined && config.emojiLevel > 0) contextLines.push(`Emoji level: ${config.emojiLevel}/10`);
    if (config.language) contextLines.push(`Language: ${config.language}`);

    if (contextLines.length > 0) {
      systemParts.push(`Context:\n${contextLines.join("\n")}`);
    }

    const systemMessage = systemParts.join("\n\n");

    // Build message history
    const messages: ModelMessage[] = [];

    if (source.history) {
      const recent = source.history.slice(-20);
      for (const msg of recent) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    if (source.currentMessage) {
      messages.push({ role: "user", content: source.currentMessage });
    }

    return { systemMessage, messages, config };
  }

  private getToneDescription(tone: Tone): string {
    const map: Record<string, string> = {
      professional: "Use formal, polished language. Clear structure with actionable points. No slang or emojis.",
      friendly: "Use warm, conversational language. Be approachable and supportive. Natural and genuine.",
      casual: "Use relaxed, everyday language. Contractions and casual expressions welcome.",
      formal: "Use strictly formal language. Suitable for official documents and high-stakes communication.",
      luxury: "Use refined, sophisticated language. Premium and exclusive. Quality over quantity.",
      corporate: "Use corporate business language. Structured, authoritative, with proper terminology.",
      ceo: "Communicate as a visionary leader. Decisive, inspiring, commanding respect.",
      genz: "Use authentic Gen Z style. Modern slang, casual, expressive. Keep it real.",
      millennial: "Conversational millennial style. Relatable, slightly self-aware, balanced.",
      dating: "Confident, charming, and engaging. Playful but genuine. Show personality.",
      funny: "Witty and entertaining. Clever wordplay and lighthearted humor.",
      sarcastic: "Dry wit and clever irony. Obviously humorous, never mean.",
      polite: "Exceptionally courteous and gracious. Warmly formal with genuine respect.",
      romantic: "Tender and heartfelt. Poetic warmth with genuine emotion.",
      creative: "Vivid and imaginative. Metaphors, rich language, engaging narrative.",
      minimal: "Extremely concise. Every word earns its place. Maximum impact, minimum words.",
      academic: "Formal academic style. Precise terminology, structured arguments, evidence-based.",
    };
    return map[tone] || map.professional;
  }
}

export const contextBuilder = new ContextBuilder();
