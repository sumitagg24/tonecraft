import type { Tone, ResponseLength } from "@/engine/types";
import { contextBlock } from "./utils";

export function buildSummarizePrompt(input: string, length?: ResponseLength): string {
  const lengthGuide = length === "short" ? "1-2 sentences"
    : length === "long" ? "a comprehensive but concise paragraph"
    : "a brief paragraph";

  return `You are a skilled summarizer. Summarize the following text in ${lengthGuide}. Capture the key points, main argument, and crucial details. Omit examples and tangential information.

Text to summarize:
${input}`;
}

export function buildEnhancePrompt(input: string, tone?: Tone): string {
  const toneNote = tone ? ` Keep the ${tone} tone.` : " Preserve the original tone.";
  return `You are a writing enhancement expert. Improve the following text — make it more engaging, clear, and impactful. Enhance vocabulary, improve sentence structure, strengthen arguments, and polish the overall flow without changing the original meaning.${toneNote}

Text to enhance:
${input}`;
}

export function buildPromptImproverPrompt(input: string): string {
  return `You are an AI prompt engineering expert. Improve the following prompt to make it more effective.

Current prompt:
"${input}"

Provide:
1. Improved version with better structure
2. Brief explanation of improvements

Make it: specific, contextual, formatted, with constraints and desired output format.`;
}

export function buildCustomPrompt(input: string, config: Record<string, unknown>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = contextBlock(config as any);
  return `You are a versatile writing assistant. Follow the instructions below carefully.${ctx}\n\n${input}`;
}
