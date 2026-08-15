// ═══════════════════════════════════════════════════════════════════════
// EMBEDDINGS — dependency-free
//
// Two modes:
//  1. When EMBEDDINGS_API_URL + EMBEDDINGS_API_KEY are set, calls an
//     OpenAI-compatible /embeddings endpoint (works with OpenAI, Together,
//     Groq, OpenRouter, etc.) and returns the real vector.
//  2. Otherwise falls back to a deterministic hashing-based vector
//     (fixed 384 dims) so semantic recall still works locally with zero
//     network calls. Swap in a real provider later without changing callers.
//
// `embed()` is fire-and-forget safe: it never throws. `cosineSimilarity`
// is the pure comparison used by MemoryService and KnowledgeService.
// ═══════════════════════════════════════════════════════════════════════

import { logger } from "./logger";

const EMBED_DIM = 384;

const CONFIGURED = Boolean(
  process.env.EMBEDDINGS_API_URL &&
    process.env.EMBEDDINGS_API_KEY &&
    process.env.EMBEDDINGS_API_URL !== "https://..."
);

export function isEmbeddingsConfigured(): boolean {
  return CONFIGURED;
}

/** Deterministic n-gram hash vector — stable across processes (same input → same vector). */
export function hashVector(text: string, dim: number = EMBED_DIM): number[] {
  const vector = new Array<number>(dim).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    // Two rolling hashes (FNV-1a style) seed two dimensions per token.
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    for (let i = 0; i < token.length; i++) {
      h1 = Math.imul(h1 ^ token.charCodeAt(i), 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ token.charCodeAt(i), 0x85ebca6b) >>> 0;
    }
    const i1 = h1 % dim;
    const i2 = h2 % dim;
    vector[i1] += 1;
    if (i2 !== i1) vector[i2] += 0.5;
  }

  // L2-normalize so cosine similarity behaves.
  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vector[i] /= norm;
  return vector;
}

async function fetchEmbedding(text: string): Promise<number[] | null> {
  const url = process.env.EMBEDDINGS_API_URL;
  const key = process.env.EMBEDDINGS_API_KEY;
  const model = process.env.EMBEDDINGS_MODEL ?? "text-embedding-3-small";
  if (!url || !key) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: text.slice(0, 8_000) }),
      signal: controller.signal,
    });
    if (!res.ok) {
      logger.warn(`[embeddings] provider returned HTTP ${res.status} — using hash fallback`);
      return null;
    }
    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
      logger.warn("[embeddings] provider returned no vector — using hash fallback");
      return null;
    }
    return embedding;
  } catch (error) {
    // Degrading to the hash fallback silently makes semantic recall quietly
    // worse — always leave a trace of why.
    logger.warn("[embeddings] provider request failed — using hash fallback", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Embed text — real vector when configured, hash fallback otherwise. Never throws. */
export async function embed(text: string): Promise<number[]> {
  if (CONFIGURED) {
    const real = await fetchEmbedding(text);
    if (real) return real;
  }
  return hashVector(text);
}

/** L2-normalize a vector (for provider embeddings that aren't normalized). */
export function normalize(vec: number[]): number[] {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

/** Cosine similarity between two vectors (0–1). Pure + testable. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Vector-as-JSON bridge for Prisma Json fields. */
export function toJsonVector(vec: number[]): { __vec: number[] } {
  return { __vec: vec };
}

export function fromJsonVector(value: unknown): number[] | null {
  if (!value || typeof value !== "object") return null;
  const v = (value as { __vec?: unknown }).__vec;
  if (!Array.isArray(v)) return null;
  return v as number[];
}
