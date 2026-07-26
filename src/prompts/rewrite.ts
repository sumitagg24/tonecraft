import type { Tone, Platform, ResponseLength, Formality } from "@/engine/types";
import { contextBlock } from "./utils";

export interface RewriteConfig {
  tone: Tone;
  platform?: Platform;
  length?: ResponseLength;
  formality?: Formality;
  creativity?: number;
  emojiLevel?: number;
  audience?: string;
}

export function buildRewritePrompt(input: string, config: RewriteConfig): string {
  const toneInstructions: Record<string, string> = {
    professional: "Rewrite this to be highly professional, polished, and authoritative. Use sophisticated vocabulary, clear structure, and formal business language.",
    casual: "Rewrite this in a relaxed, conversational tone. Use everyday language, contractions, and a warm approach. Make it sound natural and effortless.",
    friendly: "Rewrite this to be warm, approachable, and kind. Use a positive, encouraging tone. Make the reader feel comfortable and valued.",
    luxury: "Rewrite this with refined, premium language. Evoke elegance and exclusivity. Use sophisticated, aspirational wording. Think high-end brand communication.",
    corporate: "Rewrite this as corporate communications. Use formal business language with clear structure, action items, and professional sign-offs. Authoritative and polished.",
    ceo: "Rewrite this as a CEO-level communication. Be visionary, decisive, and inspiring. Use confident language that commands respect while remaining approachable.",
    genz: "Rewrite this in authentic Gen Z style. Use modern slang naturally, casual tone, lowercase where appropriate, and expressive language. Keep it real and relatable.",
    millennial: "Rewrite this in relatable millennial style. Conversational but thoughtful, use appropriate emojis, balance professionalism with personality.",
    dating: "Rewrite this to be confident, charming, and engaging. Be playful and authentic. Keep it light, show genuine interest, and leave room for conversation.",
    funny: "Rewrite this to be witty and entertaining. Use clever wordplay, humor, and lighthearted observations. Make people smile while delivering the message.",
    sarcastic: "Rewrite this with dry wit and irony. Use clever sarcasm that's obviously humorous, not mean-spirited. Deadpan delivery with a wink.",
    polite: "Rewrite this with exceptional courtesy and graciousness. Use polite phrasing, express gratitude, soften requests. Be warmly formal.",
    romantic: "Rewrite this with tender, heartfelt language. Express warmth and genuine emotion. Choose words that convey care, affection, and thoughtfulness.",
    creative: "Rewrite this with vivid imagery and imaginative language. Use metaphors, rich descriptions, and engaging narrative style. Make it memorable.",
    minimal: "Rewrite this to be extremely concise and clean. Strip every unnecessary word. Maximum impact with minimum words. Think Hemingway.",
    academic: "Rewrite this in formal academic style. Use precise terminology, structured arguments, evidence-based reasoning. Cite concepts and acknowledge complexity.",
  };

  const instruction = toneInstructions[config.tone] || toneInstructions.professional;
  const ctx = contextBlock({
    platform: config.platform,
    length: config.length,
    formality: config.formality,
    creativity: config.creativity,
    emojiLevel: config.emojiLevel,
    audience: config.audience,
  });

  return `${instruction}\n\nText to rewrite:\n${input}${ctx}`;
}
