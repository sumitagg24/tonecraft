import { describe, it, expect } from "@jest/globals";
import { LocalToneEngine, localToneEngine } from "@/engine/LocalToneEngine";
import type { EngineOptions, EngineStreamEvent, Platform, Tone } from "@/engine/types";

const engine = new LocalToneEngine();

/** `intent` is required but unused by the local engine's tone templates. */
function opts(overrides: Partial<EngineOptions> = {}): EngineOptions {
  return { intent: "rewrite", ...overrides };
}

describe("LocalToneEngine.transform", () => {
  it("reports the local provider and a token estimate", async () => {
    const result = await engine.transform(opts({ prompt: "ship the release" }));
    expect(result.provider).toBe("tonecraft-local");
    expect(result.model).toBe("tonecraft-local-v1");
    expect(result.tokens).toBe(result.content.split(/\s+/).length);
    expect(result.latency).toBe(120);
  });

  it("defaults to a professional tone for an empty prompt", async () => {
    const result = await engine.transform(opts());
    expect(result.content).toContain("Dear Team,");
    expect(result.content).toContain("Hello world");
  });

  it.each([
    ["professional", "Dear Team,"],
    ["formal", "Dear Team,"],
    ["corporate", "Dear Team,"],
    ["executive", "**Executive Summary**"],
    ["ceo", "**Executive Summary**"],
    ["friendly", "Hey there!"],
    ["polite", "Hey there!"],
    ["creative", "Crafted Perspective"],
    ["romantic", "Crafted Perspective"],
    ["luxury", "Excellence Defined"],
    ["funny", "Here's the honest take"],
    ["sarcastic", "Here's the honest take"],
    ["genz", "no cap"],
    ["slang", "no cap"],
    ["casual", "no cap"],
    ["academic", "**Abstract Analysis**"],
    ["minimal", "Status: Ready"],
    ["direct", "Status: Ready"],
  ])("renders the %s tone template", async (tone, marker) => {
    const result = await engine.transform(opts({ prompt: "we shipped the feature", tone: tone as Tone }));
    expect(result.content).toContain(marker);
  });

  it("matches tones case-insensitively", async () => {
    const result = await engine.transform(opts({ prompt: "hello", tone: "GenZ" as Tone }));
    expect(result.content).toContain("no cap");
  });

  it("annotates unknown tones instead of dropping the text", async () => {
    const result = await engine.transform(opts({ prompt: "keep this text", tone: "pirate" as Tone }));
    expect(result.content).toBe("keep this text\n\n[Tone Applied: Pirate]");
  });

  it("capitalizes the input for the professional template", async () => {
    const result = await engine.transform(opts({ prompt: "we shipped it" }));
    expect(result.content).toContain("We shipped it.");
  });

  it("trims surrounding whitespace from the input", async () => {
    const result = await engine.transform(opts({ prompt: "  spaced  ", tone: "minimal" }));
    expect(result.content.startsWith("• spaced\n")).toBe(true);
  });

  it.each([
    ["linkedin", "#ToneCraft"],
    ["email", "Subject: Update"],
    ["twitter", "🧵 1/1 #ToneCraft"],
  ])("adapts the output for %s", async (platform, marker) => {
    const result = await engine.transform(opts({ prompt: "launch day is here", tone: "minimal", platform: platform as Platform }));
    expect(result.content).toContain(marker);
  });

  it("leaves chat platforms unwrapped", async () => {
    const slack = await engine.transform(opts({ prompt: "standup at 10", tone: "minimal", platform: "slack" }));
    const whatsapp = await engine.transform(opts({ prompt: "standup at 10", tone: "minimal", platform: "whatsapp" }));
    const plain = await engine.transform(opts({ prompt: "standup at 10", tone: "minimal" }));
    expect(slack.content).toBe(plain.content);
    expect(whatsapp.content).toBe(plain.content);
  });

  it("truncates the twitter adaptation to a tweet-sized body", async () => {
    const long = "word ".repeat(200);
    const result = await engine.transform(opts({ prompt: long, tone: "minimal", platform: "twitter" }));
    const [body] = result.content.split("\n\n🧵");
    expect(body.length).toBeLessThanOrEqual(260);
  });
});

describe("LocalToneEngine.stream", () => {
  it("streams word tokens then a done event with metadata", async () => {
    const events: EngineStreamEvent[] = [];
    for await (const event of engine.stream(opts({ prompt: "hi", tone: "minimal", platform: "slack" }))) {
      events.push(event);
    }

    const tokens = events.filter((e) => e.type === "token");
    const done = events.at(-1);
    expect(tokens.length).toBeGreaterThan(0);
    expect(done?.type).toBe("done");

    const streamed = tokens.map((e) => (e.type === "token" ? e.content : "")).join("");
    const transformed = await engine.transform(opts({ prompt: "hi", tone: "minimal", platform: "slack" }));
    expect(streamed).toBe(transformed.content);

    if (done?.type !== "done") throw new Error("expected a done event");
    expect(done.result.provider).toBe("tonecraft-local");
    expect(done.result.tokens).toBe(tokens.length);
    expect(done.result.metadata).toMatchObject({
      intent: "rewrite",
      tone: "minimal",
      platform: "slack",
      model: "tonecraft-local-v1",
    });
  });

  it("defaults the metadata intent and tone", async () => {
    const events: EngineStreamEvent[] = [];
    for await (const event of engine.stream(opts({ prompt: "hi", tone: "minimal" }))) {
      events.push(event);
    }
    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("expected a done event");
    expect(done.result.metadata).toMatchObject({ intent: "rewrite", tone: "minimal", platform: undefined });
  });

  it("exports a shared singleton", () => {
    expect(localToneEngine).toBeInstanceOf(LocalToneEngine);
  });
});
