import { describe, it, expect, jest } from "@jest/globals";
import { computeTrendingScore, mergeRatingAgg } from "@/services/MarketplaceService";
import { cosineSimilarity, normalize, embed, hashVector, toJsonVector, fromJsonVector } from "@/lib/embeddings";
import { MemoryService } from "@/services/MemoryService";

jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// --- Marketplace scoring (pure) ----------------------------------------

describe("Marketplace trending + rating aggregation", () => {
  it("computes a positive trending score from downloads, rating, and recency", () => {
    const score = computeTrendingScore(250, 4.6, 40, 5);
    expect(score).toBeGreaterThan(0);
    // Theoretical max: 1000 downloads (12) + 5★ rating (8) + recency (2) ≈ 22
    expect(score).toBeLessThan(22);
  });

  it("decays trending with age — new items beat old ones at equal engagement", () => {
    const fresh = computeTrendingScore(100, 4, 10, 2);
    const old = computeTrendingScore(100, 4, 10, 80);
    expect(fresh).toBeGreaterThan(old);
  });

  it("recency bottoms out at zero beyond 90 days", () => {
    const score = computeTrendingScore(0, 0, 0, 200);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("merges a new rating into the mean aggregate", () => {
    const { agg, count } = mergeRatingAgg(4, 4, 5);
    expect(count).toBe(5);
    expect(agg).toBeCloseTo(4.2, 1);
  });
});

// --- Embeddings (hash fallback + cosine) --------------------------------

describe("Embeddings", () => {
  it("produces deterministic vectors of fixed dimension without a provider", async () => {
    const v1 = await embed("the quick brown fox");
    const v2 = await embed("the quick brown fox");
    expect(v1).toEqual(v2);
    expect(v1.length).toBeGreaterThan(100);
  });

  it("normalizes vectors to unit length", () => {
    const vec = normalize([3, 4]);
    expect(Math.sqrt(vec[0] ** 2 + vec[1] ** 2)).toBeCloseTo(1, 5);
  });

  it("returns 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 5);
  });

  it("returns 0 for empty or mismatched vectors", () => {
    expect(cosineSimilarity([], [1])).toBe(0);
    expect(cosineSimilarity([1], [1, 2])).toBe(0);
  });

  it("round-trips vectors through the JSON bridge", () => {
    const vec = hashVector("hello world");
    expect(fromJsonVector(toJsonVector(vec))).toEqual(vec);
    expect(fromJsonVector({ notAVector: true })).toBeNull();
  });
});

// --- Memory recall ranking (pure) --------------------------------------

describe("MemoryService ranking + decay", () => {
  it("decays importance with age but never below the floor", () => {
    const now = new Date("2026-08-06T12:00:00Z");
    const recent = new Date("2026-08-05T12:00:00Z"); // 1 day
    const ancient = new Date("2020-01-01T00:00:00Z");
    expect(MemoryService.decayedImportance(100, recent, now)).toBeLessThan(100);
    expect(MemoryService.decayedImportance(100, ancient, now)).toBe(5);
    expect(MemoryService.decayedImportance(6, recent, now)).toBeGreaterThanOrEqual(5);
  });

  it("ranks highly relevant + recent + important memories highest", () => {
    const relevant = MemoryService.rank(1, 1, 90);
    const stale = MemoryService.rank(1, 80, 90);
    expect(relevant).toBeGreaterThan(stale);
    const important = MemoryService.rank(0.5, 1, 100);
    const trivial = MemoryService.rank(0.5, 1, 5);
    expect(important).toBeGreaterThan(trivial);
  });
});
