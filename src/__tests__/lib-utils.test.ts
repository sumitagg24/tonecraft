import { describe, it, expect } from "@jest/globals";
import { cn, formatDate, formatFileSize, truncate, safeRedirectUrl, timeAgo } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { modelTierLabel, providerLabel } from "@/lib/ai-labels";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values and resolves conditionals", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("lets later tailwind classes win over conflicting earlier ones", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500");
  });
});

describe("formatDate", () => {
  it("formats a Date as short month, day and year", () => {
    expect(formatDate(new Date("2024-03-07T12:00:00Z"))).toBe("Mar 7, 2024");
  });

  it("accepts an ISO string", () => {
    expect(formatDate("2024-12-31T12:00:00Z")).toBe("Dec 31, 2024");
  });
});

describe("formatFileSize", () => {
  it("returns 0 B for an empty file", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("scales through the unit table", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatFileSize(3 * 1024 * 1024 * 1024)).toBe("3 GB");
  });

  it("rounds to a single decimal", () => {
    expect(formatFileSize(1024 * 1024 * 1.25)).toBe("1.3 MB");
  });
});

describe("truncate", () => {
  it("leaves strings within the limit untouched", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("appends an ellipsis when over the limit", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });
});

describe("safeRedirectUrl", () => {
  it("allows internal relative paths", () => {
    expect(safeRedirectUrl("/dashboard")).toBe("/dashboard");
    expect(safeRedirectUrl("/chat?id=1")).toBe("/chat?id=1");
  });

  it("returns undefined for empty input", () => {
    expect(safeRedirectUrl(undefined)).toBeUndefined();
    expect(safeRedirectUrl(null)).toBeUndefined();
    expect(safeRedirectUrl("")).toBeUndefined();
  });

  it("blocks absolute URLs and protocol-relative bypasses", () => {
    expect(safeRedirectUrl("https://evil.example")).toBeUndefined();
    expect(safeRedirectUrl("//evil.example")).toBeUndefined();
    expect(safeRedirectUrl("/\\evil.example")).toBeUndefined();
    expect(safeRedirectUrl("javascript:alert(1)")).toBeUndefined();
  });
});

describe("timeAgo", () => {
  const now = new Date("2024-06-15T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats sub-minute distances", () => {
    expect(timeAgo(ago(5_000))).toBe("5 seconds ago");
    expect(timeAgo(ago(0))).toBe("1 second ago");
  });

  it("formats minutes, hours, days, months and years", () => {
    expect(timeAgo(ago(3 * 60_000))).toBe("3 minutes ago");
    expect(timeAgo(ago(5 * 3_600_000))).toBe("5 hours ago");
    expect(timeAgo(ago(2 * 86_400_000))).toBe("2 days ago");
    expect(timeAgo(ago(60 * 86_400_000))).toBe("2 months ago");
    expect(timeAgo(ago(400 * 86_400_000))).toBe("last year");
  });

  it("returns compact units when the suffix is disabled", () => {
    expect(timeAgo(ago(5_000), false)).toBe("5s");
    expect(timeAgo(ago(3 * 60_000), false)).toBe("3m");
    expect(timeAgo(ago(5 * 3_600_000), false)).toBe("5h");
    expect(timeAgo(ago(2 * 86_400_000), false)).toBe("2d");
    expect(timeAgo(ago(60 * 86_400_000), false)).toBe("2mo");
    expect(timeAgo(ago(400 * 86_400_000), false)).toBe("1y");
  });

  it("accepts an ISO string", () => {
    expect(timeAgo("2024-06-15T11:00:00Z")).toBe("1 hour ago");
  });
});

describe("formatMoney", () => {
  it("prefixes the amount with a dollar sign", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(19)).toBe("$19");
  });
});

describe("modelTierLabel", () => {
  it("falls back to a neutral label without a model", () => {
    expect(modelTierLabel(null)).toBe("AI Model");
    expect(modelTierLabel(undefined)).toBe("AI Model");
    expect(modelTierLabel("")).toBe("AI Model");
  });

  it("maps model families to opaque tier labels", () => {
    expect(modelTierLabel("gemini-3.6-flash")).toBe("Fast Model");
    expect(modelTierLabel("claude-3-haiku")).toBe("Fast Model");
    expect(modelTierLabel("gemini-3.1-pro-preview")).toBe("Premium Model");
    expect(modelTierLabel("claude-sonnet-4")).toBe("Premium Model");
    expect(modelTierLabel("gpt-4o-mini")).toBe("Standard Model");
    expect(modelTierLabel("tonecraft-local-v1")).toBe("ToneCraft Engine");
  });

  it("never leaks an unrecognized identifier", () => {
    expect(modelTierLabel("llama-3.3-70b-versatile")).toBe("AI Model");
  });
});

describe("providerLabel", () => {
  it("returns a neutral label without a provider", () => {
    expect(providerLabel(null)).toBe("AI");
    expect(providerLabel(undefined)).toBe("AI");
  });

  it("labels the built-in engine and hides third-party providers", () => {
    expect(providerLabel("tonecraft-local")).toBe("ToneCraft Engine");
    expect(providerLabel("google")).toBe("Cloud AI");
    expect(providerLabel("groq")).toBe("Cloud AI");
  });
});
