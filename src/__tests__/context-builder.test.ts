import { describe, it, expect } from "@jest/globals";
import { ContextBuilder, contextBuilder, type ContextSource } from "@/engine/ContextBuilder";
import type { IntentConfig } from "@/engine/types";

const builder = new ContextBuilder();
const baseConfig: IntentConfig = { intent: "rewrite" };

describe("ContextBuilder.build — system message", () => {
  it("defaults to the professional tone description", () => {
    const { systemMessage } = builder.build({}, baseConfig);
    expect(systemMessage).toBe(
      "Use formal, polished language. Clear structure with actionable points. No slang or emojis.",
    );
  });

  it("puts the persona system prompt first", () => {
    const { systemMessage } = builder.build({ persona: { systemPrompt: "You are Ada." } }, baseConfig);
    expect(systemMessage.startsWith("You are Ada.\n\n")).toBe(true);
  });

  it("prefers the persona tone, then the config tone, then preferences", () => {
    expect(
      builder.build({ persona: { tone: "genz" }, preferences: { tone: "formal" } }, { ...baseConfig, tone: "minimal" })
        .systemMessage,
    ).toContain("Gen Z");
    expect(builder.build({ preferences: { tone: "formal" } }, { ...baseConfig, tone: "minimal" }).systemMessage).toContain(
      "Extremely concise",
    );
    expect(builder.build({ preferences: { tone: "casual" } }, baseConfig).systemMessage).toContain("relaxed, everyday");
  });

  it("falls back to the professional description for unknown tones", () => {
    const { systemMessage } = builder.build({ preferences: { tone: "klingon" } }, baseConfig);
    expect(systemMessage).toContain("formal, polished language");
  });

  it("only mentions a non-standard writing style", () => {
    expect(builder.build({ preferences: { style: "standard" } }, baseConfig).systemMessage).not.toContain(
      "Writing style",
    );
    expect(builder.build({ preferences: { style: "storytelling" } }, baseConfig).systemMessage).toContain(
      "Writing style: storytelling",
    );
    expect(builder.build({ persona: { writingStyle: "persuasive" } }, baseConfig).systemMessage).toContain(
      "Writing style: persuasive",
    );
  });

  it("translates the persona emoji preference", () => {
    expect(builder.build({ persona: { emojiUsage: "subtle" } }, baseConfig).systemMessage).toContain(
      "Emoji: Use emojis sparingly.",
    );
    expect(builder.build({ persona: { emojiUsage: "moderate" } }, baseConfig).systemMessage).toContain(
      "Emoji: Use emojis moderately.",
    );
    expect(builder.build({ persona: { emojiUsage: "heavy" } }, baseConfig).systemMessage).toContain(
      "Emoji: Use emojis liberally.",
    );
    expect(builder.build({ persona: { emojiUsage: "none" } }, baseConfig).systemMessage).not.toContain("Emoji");
    expect(builder.build({ persona: { emojiUsage: "wild" } }, baseConfig).systemMessage).toContain("Emoji: ");
  });

  it("includes the knowledge grounding block and language preference", () => {
    const { systemMessage } = builder.build(
      { knowledge: { systemBlock: "KB: refunds take 5 days." }, preferences: { language: "German" } },
      baseConfig,
    );
    expect(systemMessage).toContain("KB: refunds take 5 days.");
    expect(systemMessage).toContain("Language: German");
  });

  it("renders the context block from the intent config", () => {
    const { systemMessage } = builder.build({}, {
      intent: "social",
      platform: "linkedin",
      audience: "founders",
      length: "short",
      formality: "formal",
      creativity: 40,
      emojiLevel: 2,
      language: "English",
    });
    expect(systemMessage).toContain(
      "Context:\nPlatform: linkedin\nAudience: founders\nLength: short\nFormality: formal\nCreativity: 40/100\nEmoji level: 2/10\nLanguage: English",
    );
  });

  it("omits neutral platforms and a zero emoji level", () => {
    const { systemMessage } = builder.build({}, {
      intent: "rewrite",
      platform: "general" as never,
      emojiLevel: 0,
      creativity: 0,
    });
    expect(systemMessage).not.toContain("Platform:");
    expect(systemMessage).not.toContain("Emoji level");
    expect(systemMessage).toContain("Creativity: 0/100");
  });

  it("omits the context section entirely when nothing applies", () => {
    expect(builder.build({}, baseConfig).systemMessage).not.toContain("Context:");
  });
});

describe("ContextBuilder.build — messages", () => {
  it("returns no messages without history or a current message", () => {
    expect(builder.build({}, baseConfig).messages).toEqual([]);
  });

  it("maps history to model messages and appends the current message", () => {
    const source: ContextSource = {
      history: [
        { id: "1", role: "user", content: "hi" },
        { id: "2", role: "assistant", content: "hello" },
      ],
      currentMessage: "rewrite this",
    };
    expect(builder.build(source, baseConfig).messages).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
      { role: "user", content: "rewrite this" },
    ]);
  });

  it("keeps only the last 20 history entries", () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      role: "user" as const,
      content: `msg-${i}`,
    }));
    const { messages } = builder.build({ history }, baseConfig);
    expect(messages).toHaveLength(20);
    expect(messages[0].content).toBe("msg-5");
    expect(messages[19].content).toBe("msg-24");
  });

  it("passes the resolved config back to the caller", () => {
    const config: IntentConfig = { intent: "email", tone: "polite" };
    expect(builder.build({}, config).config).toBe(config);
  });

  it("exports a shared singleton", () => {
    expect(contextBuilder).toBeInstanceOf(ContextBuilder);
  });
});
