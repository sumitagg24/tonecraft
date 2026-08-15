import { describe, it, expect } from "@jest/globals";
import { IntentEngine, intentEngine } from "@/engine/IntentEngine";

describe("IntentEngine.resolve", () => {
  const engine = new IntentEngine();

  it("maps a known tool key to its intent family and defaults", () => {
    expect(engine.resolve("professional-rewrite")).toMatchObject({
      intent: "rewrite",
      tone: "professional",
      platform: undefined,
    });
    expect(engine.resolve("whatsapp-reply")).toMatchObject({
      intent: "reply",
      tone: "friendly",
      platform: "whatsapp",
    });
    expect(engine.resolve("linkedin-post")).toMatchObject({
      intent: "social",
      tone: "professional",
      platform: "linkedin",
    });
    expect(engine.resolve("cold-email")).toMatchObject({
      intent: "email",
      tone: "professional",
      platform: "email",
    });
  });

  it("routes utility and career tools to their engines", () => {
    expect(engine.resolve("grammar-fix").intent).toBe("grammar");
    expect(engine.resolve("translate").intent).toBe("translate");
    expect(engine.resolve("summarize").intent).toBe("summarize");
    expect(engine.resolve("enhance").intent).toBe("enhance");
    expect(engine.resolve("simplify")).toMatchObject({ intent: "grammar", tone: "friendly" });
    expect(engine.resolve("resume-bullet").intent).toBe("resume");
    expect(engine.resolve("cover-letter").intent).toBe("cover-letter");
    expect(engine.resolve("interview-answer").intent).toBe("cover-letter");
    expect(engine.resolve("github-readme")).toMatchObject({ intent: "custom", platform: "github" });
  });

  it("falls back to the custom mapping for unknown keys", () => {
    expect(engine.resolve("not-a-real-tool")).toEqual(engine.resolve("custom"));
    expect(engine.resolve("not-a-real-tool").intent).toBe("custom");
  });

  it("lets overrides win over the mapping defaults", () => {
    const config = engine.resolve("whatsapp-reply", {
      tone: "sarcastic",
      platform: "slack",
      length: "short",
      creativity: 80,
      emojiLevel: 3,
      language: "French",
      audience: "engineers",
      formality: "casual",
      style: "storytelling",
    });
    expect(config).toEqual({
      intent: "reply",
      tone: "sarcastic",
      platform: "slack",
      length: "short",
      creativity: 80,
      emojiLevel: 3,
      language: "French",
      audience: "engineers",
      formality: "casual",
      style: "storytelling",
    });
  });

  it("leaves unspecified fields undefined", () => {
    const config = engine.resolve("grammar-fix");
    expect(config.length).toBeUndefined();
    expect(config.creativity).toBeUndefined();
    expect(config.emojiLevel).toBeUndefined();
    expect(config.language).toBeUndefined();
    expect(config.audience).toBeUndefined();
    expect(config.formality).toBeUndefined();
    expect(config.style).toBeUndefined();
  });
});

describe("IntentEngine registry", () => {
  it("exposes the built-in intent map", () => {
    const intents = new IntentEngine().getIntents();
    expect(Object.keys(intents).length).toBeGreaterThan(50);
    expect(intents["linkedin-post"].description).toBe("LinkedIn post");
  });

  it("resolves newly registered intents", () => {
    const engine = new IntentEngine();
    engine.registerIntent("pirate-rewrite", {
      intent: "rewrite",
      defaultTone: "funny",
      defaultPlatform: "twitter",
      defaultStyle: "storytelling",
      description: "Pirate rewrite",
    });
    expect(engine.resolve("pirate-rewrite")).toMatchObject({
      intent: "rewrite",
      tone: "funny",
      platform: "twitter",
      style: "storytelling",
    });
  });

  it("exports a shared singleton", () => {
    expect(intentEngine).toBeInstanceOf(IntentEngine);
    expect(intentEngine.resolve("rizz")).toMatchObject({ intent: "rewrite", tone: "dating" });
  });
});
