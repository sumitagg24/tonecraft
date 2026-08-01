import type { Intent, IntentConfig, Tone, Platform } from "./types";

interface IntentMapping {
  intent: Intent;
  defaultTone: Tone;
  defaultPlatform?: Platform;
  defaultStyle?: string;
  description: string;
}

const INTENT_MAP: Record<string, IntentMapping> = {
  // Rewrite family
  "professional-rewrite": { intent: "rewrite", defaultTone: "professional", description: "Professional rewrite" },
  "casual-rewrite": { intent: "rewrite", defaultTone: "casual", description: "Casual rewrite" },
  "friendly-rewrite": { intent: "rewrite", defaultTone: "friendly", description: "Friendly rewrite" },
  "formal-rewrite": { intent: "rewrite", defaultTone: "formal", description: "Formal rewrite" },
  "luxury-rewrite": { intent: "rewrite", defaultTone: "luxury", description: "Luxury rewrite" },
  "corporate-rewrite": { intent: "rewrite", defaultTone: "corporate", description: "Corporate rewrite" },
  "ceo-rewrite": { intent: "rewrite", defaultTone: "ceo", description: "CEO-style rewrite" },
  "genz-rewrite": { intent: "rewrite", defaultTone: "genz", description: "Gen Z rewrite" },
  "millennial-rewrite": { intent: "rewrite", defaultTone: "millennial", description: "Millennial rewrite" },
  "dating-rewrite": { intent: "rewrite", defaultTone: "dating", description: "Dating rewrite" },
  "funny-rewrite": { intent: "rewrite", defaultTone: "funny", description: "Funny rewrite" },
  "sarcastic-rewrite": { intent: "rewrite", defaultTone: "sarcastic", description: "Sarcastic rewrite" },
  "polite-rewrite": { intent: "rewrite", defaultTone: "polite", description: "Polite rewrite" },
  "romantic-rewrite": { intent: "rewrite", defaultTone: "romantic", description: "Romantic rewrite" },

  // Reply family
  "whatsapp-reply": { intent: "reply", defaultTone: "friendly", defaultPlatform: "whatsapp", description: "WhatsApp reply" },
  "instagram-reply": { intent: "reply", defaultTone: "friendly", defaultPlatform: "instagram", description: "Instagram reply" },
  "messenger-reply": { intent: "reply", defaultTone: "friendly", defaultPlatform: "messenger", description: "Messenger reply" },
  "linkedin-reply": { intent: "reply", defaultTone: "professional", defaultPlatform: "linkedin", description: "LinkedIn reply" },
  "twitter-reply": { intent: "reply", defaultTone: "casual", defaultPlatform: "twitter", description: "Twitter/X reply" },
  "professional-reply": { intent: "reply", defaultTone: "professional", defaultPlatform: "email", description: "Professional reply" },
  "funny-reply": { intent: "reply", defaultTone: "funny", description: "Funny reply" },
  "customer-support-reply": { intent: "reply", defaultTone: "polite", description: "Customer support reply" },
  "genz-reply": { intent: "reply", defaultTone: "genz", description: "Gen Z reply" },
  "dating-reply": { intent: "reply", defaultTone: "dating", defaultPlatform: "whatsapp", description: "Dating reply" },
  "polite-reply": { intent: "reply", defaultTone: "polite", description: "Polite reply" },
  "sarcastic-reply": { intent: "reply", defaultTone: "sarcastic", description: "Sarcastic reply" },

  // Social family
  "linkedin-post": { intent: "social", defaultTone: "professional", defaultPlatform: "linkedin", description: "LinkedIn post" },
  "twitter-thread": { intent: "social", defaultTone: "casual", defaultPlatform: "twitter", description: "Twitter/X thread" },
  "instagram-caption": { intent: "social", defaultTone: "friendly", defaultPlatform: "instagram", description: "Instagram caption" },
  "facebook-post": { intent: "social", defaultTone: "friendly", defaultPlatform: "facebook", description: "Facebook post" },
  "threads-post": { intent: "social", defaultTone: "casual", defaultPlatform: "threads", description: "Threads post" },
  "youtube-description": { intent: "social", defaultTone: "professional", defaultPlatform: "youtube", description: "YouTube description" },

  // Email family
  "email-writer": { intent: "email", defaultTone: "professional", defaultPlatform: "email", description: "Write email" },
  "cold-email": { intent: "email", defaultTone: "professional", defaultPlatform: "email", description: "Cold email" },
  "business-proposal": { intent: "email", defaultTone: "corporate", defaultPlatform: "email", description: "Business proposal" },
  "meeting-request": { intent: "email", defaultTone: "professional", defaultPlatform: "email", description: "Meeting request" },

  // Utility family
  "grammar-fix": { intent: "grammar", defaultTone: "professional", description: "Grammar fix" },
  "translate": { intent: "translate", defaultTone: "professional", description: "Translation" },
  "summarize": { intent: "summarize", defaultTone: "professional", description: "Summarize" },
  "enhance": { intent: "enhance", defaultTone: "professional", description: "Enhance text" },
  "simplify": { intent: "grammar", defaultTone: "friendly", description: "Simplify text" },
  "prompt-improver": { intent: "custom", defaultTone: "professional", description: "Improve prompt" },

  // Career family
  "resume-bullet": { intent: "resume", defaultTone: "professional", description: "Resume bullets" },
  "cover-letter": { intent: "cover-letter", defaultTone: "professional", description: "Cover letter" },
  "interview-answer": { intent: "cover-letter", defaultTone: "professional", description: "Interview answer" },

  // Dating family
  "rizz": { intent: "rewrite", defaultTone: "dating", description: "Rizz generator" },
  "flirty": { intent: "rewrite", defaultTone: "romantic", description: "Flirty message" },
  "apology": { intent: "rewrite", defaultTone: "polite", description: "Apology message" },

  // Default
  custom: { intent: "custom", defaultTone: "professional", description: "Custom tool" },
};

export class IntentEngine {
  resolve(intentKey: string, overrides?: Partial<IntentConfig>): IntentConfig {
    const mapping = INTENT_MAP[intentKey] || INTENT_MAP["custom"];

    return {
      intent: mapping.intent,
      tone: overrides?.tone || mapping.defaultTone,
      platform: overrides?.platform || mapping.defaultPlatform,
      length: overrides?.length,
      creativity: overrides?.creativity,
      emojiLevel: overrides?.emojiLevel,
      language: overrides?.language,
      audience: overrides?.audience,
      formality: overrides?.formality,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: overrides?.style || mapping.defaultStyle as any,
    };
  }

  getIntents(): Record<string, IntentMapping> {
    return INTENT_MAP;
  }

  registerIntent(key: string, mapping: IntentMapping): void {
    INTENT_MAP[key] = mapping;
  }
}

export const intentEngine = new IntentEngine();
