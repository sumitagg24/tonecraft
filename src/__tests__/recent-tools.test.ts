import { describe, it, expect } from "@jest/globals";
import { pushRecent, togglePin, MAX_RECENT_TOOLS } from "@/lib/recent-tools";

describe("pushRecent", () => {
  it("puts the used tool id at the front", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("dedupes existing ids", () => {
    expect(pushRecent(["a", "b", "c"], "a")).toEqual(["a", "b", "c"]);
  });

  it("caps the list at MAX_RECENT_TOOLS", () => {
    const full = Array.from({ length: MAX_RECENT_TOOLS }, (_, i) => `tool-${i}`);
    const next = pushRecent(full, "new-tool");
    expect(next).toHaveLength(MAX_RECENT_TOOLS);
    expect(next[0]).toBe("new-tool");
    // oldest item dropped
    expect(next).not.toContain("tool-7");
  });

  it("handles an empty list", () => {
    expect(pushRecent([], "a")).toEqual(["a"]);
  });

  it("does not mutate the input list", () => {
    const input = ["a", "b"];
    pushRecent(input, "c");
    expect(input).toEqual(["a", "b"]);
  });
});

describe("togglePin", () => {
  it("pins an unpinned tool at the front", () => {
    expect(togglePin(["a", "b"], "c")).toEqual(["c", "a", "b"]);
  });

  it("unpins a pinned tool", () => {
    expect(togglePin(["c", "a", "b"], "c")).toEqual(["a", "b"]);
  });

  it("handles an empty list", () => {
    expect(togglePin([], "a")).toEqual(["a"]);
  });
});
