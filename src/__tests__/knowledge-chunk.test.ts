import { describe, it, expect } from "@jest/globals";
import { chunkText, searchScore, tokenize } from "@/lib/knowledge/chunk";

describe("tokenize", () => {
  it("lowercases and strips punctuation", () => {
    expect(tokenize("Hello, World! It's 2024.")).toEqual(["hello", "world", "it", "2024"]);
  });

  it("keeps hyphens and drops single-character tokens", () => {
    expect(tokenize("a bc long-context x")).toEqual(["bc", "long-context"]);
  });

  it("returns an empty list for blank input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("  ,. ")).toEqual([]);
  });
});

describe("chunkText", () => {
  it("returns no chunks for blank text", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("keeps short documents as a single chunk", () => {
    expect(chunkText("para one\n\npara two")).toEqual([{ index: 0, content: "para one\n\npara two" }]);
  });

  it("collapses runs of blank lines", () => {
    expect(chunkText("a\n\n\n\nb")).toEqual([{ index: 0, content: "a\n\nb" }]);
  });

  it("splits long documents into sequentially indexed chunks", () => {
    const para = "x".repeat(900);
    const chunks = chunkText([para, para, para, para].join("\n\n"));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThan(2600);
    }
  });

  it("carries an overlap tail from the previous chunk", () => {
    const first = "a".repeat(1500);
    const second = "b".repeat(1500);
    const chunks = chunkText(`${first}\n\n${second}`);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe(first);
    expect(chunks[1].content.startsWith("a".repeat(200))).toBe(true);
    expect(chunks[1].content).toContain(second);
  });

  it("does not split a single oversized paragraph", () => {
    const chunks = chunkText("y".repeat(5000));
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toHaveLength(5000);
  });
});

describe("searchScore", () => {
  it("scores zero when the query has no usable tokens", () => {
    expect(searchScore("", "some content here")).toBe(0);
    expect(searchScore("a .", "some content here")).toBe(0);
  });

  it("scores zero against empty content", () => {
    expect(searchScore("refund", "")).toBe(0);
  });

  it("scores zero when no query token appears", () => {
    expect(searchScore("refund policy", "unrelated words only")).toBe(0);
  });

  it("scores a matching chunk above a non-matching one", () => {
    const hit = searchScore("refund policy", "our refund policy allows returns");
    const miss = searchScore("refund policy", "shipping times vary by region");
    expect(hit).toBeGreaterThan(miss);
  });

  it("rewards repeated query terms", () => {
    const once = searchScore("refund", "refund details are listed below for customers");
    const twice = searchScore("refund", "refund refund details are listed below for customers");
    expect(twice).toBeGreaterThan(once);
  });

  it("prefers a focused chunk over the same match buried in filler", () => {
    const focused = searchScore("refund", "refund policy summary");
    const diluted = searchScore("refund", `refund policy summary ${"filler ".repeat(400)}`);
    expect(focused).toBeGreaterThan(diluted);
  });

  it("is case-insensitive", () => {
    expect(searchScore("REFUND", "refund policy")).toBe(searchScore("refund", "REFUND POLICY"));
  });
});
