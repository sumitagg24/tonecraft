import { describe, it, expect } from "@jest/globals";
import { contextBlock } from "@/prompts/utils";
import {
  buildPrompt,
  buildCoverLetterPrompt,
  buildEnhancePrompt,
  buildGrammarPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildTranslationPrompt,
} from "@/prompts";
import { buildExpandPrompt, buildExplainPrompt, buildSimplifyPrompt } from "@/prompts/grammar";
import { buildPromptImproverPrompt } from "@/prompts/utility";
import type { IntentConfig } from "@/engine/types";

describe("contextBlock", () => {
  it("returns an empty string when nothing is configured", () => {
    expect(contextBlock({})).toBe("");
  });

  it("renders every configured field under a Context heading", () => {
    expect(
      contextBlock({
        platform: "linkedin",
        audience: "founders",
        length: "short",
        formality: "formal",
        creativity: 30,
        emojiLevel: 2,
        language: "Spanish",
      }),
    ).toBe(
      "\n\nContext:\nPlatform: linkedin\nTarget Audience: founders\nDesired Length: short\nFormality Level: formal\nCreativity Level: 30/100 (0=strict, 100=wild)\nEmoji Level: 2/10\nLanguage: Spanish",
    );
  });

  it("omits neutral platforms so models do not default to email conventions", () => {
    expect(contextBlock({ platform: "general" })).toBe("");
    expect(contextBlock({ platform: "any" })).toBe("");
    expect(contextBlock({ platform: "auto" })).toBe("");
    expect(contextBlock({ platform: "slack" })).toContain("Platform: slack");
  });

  it("keeps a zero creativity level but drops a zero emoji level", () => {
    expect(contextBlock({ creativity: 0 })).toContain("Creativity Level: 0/100");
    expect(contextBlock({ emojiLevel: 0 })).toBe("");
  });
});

describe("prompt builders", () => {
  it("selects the tone instruction for a rewrite and appends the context", () => {
    const prompt = buildRewritePrompt("make this pop", { tone: "luxury", platform: "linkedin", length: "short" });
    expect(prompt).toContain("refined, premium language");
    expect(prompt).toContain("Text to rewrite:\nmake this pop");
    expect(prompt).toContain("Platform: linkedin");
  });

  it("falls back to the professional rewrite instruction for unknown tones", () => {
    expect(buildRewritePrompt("x", { tone: "pirate" as never })).toContain("highly professional");
  });

  it("scales the summary length guide", () => {
    expect(buildSummarizePrompt("text", "short")).toContain("1-2 sentences");
    expect(buildSummarizePrompt("text", "long")).toContain("comprehensive but concise paragraph");
    expect(buildSummarizePrompt("text")).toContain("a brief paragraph");
  });

  it("preserves or pins the tone when enhancing", () => {
    expect(buildEnhancePrompt("text")).toContain("Preserve the original tone.");
    expect(buildEnhancePrompt("text", "funny")).toContain("Keep the funny tone.");
  });

  it("names the source and target translation languages", () => {
    const prompt = buildTranslationPrompt("hola", {
      targetLanguage: "English",
      sourceLanguage: "Spanish",
      tone: "formal",
      preserveFormatting: true,
    });
    expect(prompt).toContain("from Spanish to English");
    expect(prompt).toContain("Preserve the formal tone");
    expect(prompt).toContain("Preserve all formatting");
    expect(prompt).toContain("Text to translate:\nhola");
  });

  it("omits the source language when it is unknown", () => {
    const prompt = buildTranslationPrompt("hola", { targetLanguage: "English" });
    expect(prompt).toContain("the following text to English");
    expect(prompt).not.toContain("Preserve the");
  });

  it("builds the utility grammar prompts", () => {
    expect(buildGrammarPrompt("teh cat")).toContain("Text to correct:\nteh cat");
    expect(buildSimplifyPrompt("complex")).toContain("Text to simplify:\ncomplex");
    expect(buildExpandPrompt("short")).not.toContain("to make it");
    expect(buildExpandPrompt("short", "two paragraphs")).toContain("to make it two paragraphs");
    expect(buildExplainPrompt("entropy")).toContain("like I'm 5 years old");
    expect(buildExplainPrompt("entropy", "a CFO")).toContain("like I'm a CFO");
    expect(buildPromptImproverPrompt("do stuff")).toContain('"do stuff"');
  });

  it("threads the target company into a cover letter", () => {
    expect(buildCoverLetterPrompt("my background", "Acme")).toContain("Acme");
  });
});

describe("buildPrompt dispatch", () => {
  const cfg = (overrides: Partial<IntentConfig> & { intent: IntentConfig["intent"] }): IntentConfig => overrides;

  it("routes each intent to its builder", () => {
    expect(buildPrompt("rewrite", "text", cfg({ intent: "rewrite", tone: "genz" }))).toContain("Gen Z style");
    expect(buildPrompt("reply", "text", cfg({ intent: "reply" }))).toContain("WhatsApp reply");
    expect(buildPrompt("social", "text", cfg({ intent: "social" }))).toContain("LinkedIn");
    expect(buildPrompt("email", "text", cfg({ intent: "email", formality: "formal" }))).toContain(
      "formal business language",
    );
    expect(buildPrompt("grammar", "text", cfg({ intent: "grammar" }))).toContain("proofreader");
    expect(buildPrompt("translate", "text", cfg({ intent: "translate", language: "German" }))).toContain("to German");
    expect(buildPrompt("resume", "text", cfg({ intent: "resume" }))).toMatch(/resume|bullet/i);
    expect(buildPrompt("cover-letter", "text", cfg({ intent: "cover-letter", audience: "Acme" }))).toContain("Acme");
    expect(buildPrompt("summarize", "text", cfg({ intent: "summarize", length: "short" }))).toContain("1-2 sentences");
    expect(buildPrompt("enhance", "text", cfg({ intent: "enhance", tone: "polite" }))).toContain("Keep the polite tone");
    expect(buildPrompt("custom", "text", cfg({ intent: "custom", platform: "slack" }))).toContain("Platform: slack");
  });

  it("defaults the reply platform and translation language", () => {
    expect(buildPrompt("reply", "text", cfg({ intent: "reply" }))).toContain("WhatsApp");
    expect(buildPrompt("translate", "text", cfg({ intent: "translate" }))).toContain("to English");
  });

  it("falls back to the enhance prompt for unmapped intents", () => {
    expect(buildPrompt("unheard-of" as never, "text", cfg({ intent: "rewrite" }))).toContain(
      "writing enhancement expert",
    );
  });
});
