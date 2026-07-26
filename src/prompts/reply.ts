import type { Tone, Platform, ResponseLength } from "@/engine/types";
import { contextBlock } from "./utils";

export interface ReplyConfig {
  tone: Tone;
  platform: Platform;
  context?: string;
  length?: ResponseLength;
  emojiLevel?: number;
  audience?: string;
}

export function buildReplyPrompt(input: string, config: ReplyConfig): string {
  const platformGuides: Record<string, string> = {
    whatsapp: "Write a natural WhatsApp reply. Keep it concise and conversational. Use appropriate casual language.",
    instagram: "Write an Instagram DM or comment reply. Be engaging and visually descriptive. Use relevant emojis naturally.",
    messenger: "Write a Facebook Messenger reply. Friendly and casual, like chatting with an acquaintance.",
    email: "Write an email reply. Structure it properly with greeting, body, and sign-off. Match the formality of the original.",
    linkedin: "Write a LinkedIn reply. Professional but conversational. Maintain business-appropriate tone.",
    twitter: "Write a Twitter/X reply. Be concise and impactful. Under 280 characters if possible.",
    discord: "Write a Discord reply. Casual and community-oriented. Can use platform-specific culture.",
    slack: "Write a Slack reply. Professional but friendly. Get to the point quickly.",
    telegram: "Write a Telegram reply. Direct and conversational.",
    threads: "Write a Threads reply. Casual and authentic. Short-form and engaging.",
  };

  const toneInstruction = getToneInstruction(config.tone);
  const guide = platformGuides[config.platform] || "Write a natural, context-appropriate reply.";
  const ctx = contextBlock({
    platform: config.platform,
    length: config.length,
    emojiLevel: config.emojiLevel,
    audience: config.audience,
  });

  const contextStr = config.context ? `\n\nConversation context: ${config.context}` : "";

  return `${toneInstruction}\n\nPlatform: ${config.platform}\n${guide}\n\nMessage to reply to:\n${input}${contextStr}${ctx}`;
}

function getToneInstruction(tone: Tone): string {
  const map: Record<string, string> = {
    professional: "You are a business communication expert. Craft a professional, polished reply.",
    friendly: "You are a warm, approachable person. Write a friendly, genuine reply.",
    casual: "Keep it relaxed and conversational. Natural language, no forced formality.",
    funny: "You're witty and clever. Write a reply that entertains while delivering the message.",
    sarcastic: "Write with dry humor and clever irony. Obviously sarcastic, not mean.",
    polite: "Write with exceptional courtesy. Be gracious, warm, and respectfully formal.",
    genz: "You're a Gen Z digital native. Write authentically with modern slang and casual energy.",
    millennial: "You're a relatable millennial. Conversational, slightly self-aware, balanced.",
    dating: "You're confident and charming. Write a reply that's engaging and shows genuine interest.",
    romantic: "Write with tender, heartfelt language. Warm and genuine emotion.",
    luxury: "Use refined, sophisticated language. Premium and exclusive feel.",
    corporate: "Write as a corporate professional. Polished, structured, and authoritative.",
    creative: "Use imaginative language and creative expressions. Make it memorable and engaging.",
    minimal: "Be extremely concise. Every word must earn its place. Maximum impact, minimum words.",
    academic: "Use formal, evidence-based language. Structured arguments and precise terminology.",
    ceo: "You're a visionary CEO. Be decisive, inspiring, and commanding. Use confident language.",
  };
  return map[tone] || map.friendly;
}
