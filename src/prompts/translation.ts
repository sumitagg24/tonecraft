import type { Tone } from "@/engine/types";

export interface TranslationConfig {
  targetLanguage: string;
  sourceLanguage?: string;
  tone?: Tone;
  preserveFormatting?: boolean;
}

export function buildTranslationPrompt(input: string, config: TranslationConfig): string {
  let prompt = `You are a professional translator. Translate the following text ${config.sourceLanguage ? `from ${config.sourceLanguage} ` : ""}to ${config.targetLanguage}.`;

  if (config.tone) {
    prompt += `\nPreserve the ${config.tone} tone of the original.`;
  }

  if (config.preserveFormatting) {
    prompt += "\nPreserve all formatting (line breaks, bullet points, emojis).";
  }

  prompt += "\n\nOutput only the translation, no explanations.\n\nText to translate:\n" + input;
  return prompt;
}
