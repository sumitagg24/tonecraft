-- =============================================================================
-- PENDING: pgvector embeddings migration (Phase 8.14 — D1)
-- -----------------------------------------------------------------------------
-- STATUS: PREPARED, NOT APPLIED. Do not run until:
--   1. The embedding model's output dimension is confirmed (match the 1536
--      placeholder below to the model used in src/lib/knowledge/).
--   2. pgvector is installed on the Neon project (`CREATE EXTENSION` requires
--      superuser — Neon supports it via the SQL editor/`psql` with a direct
--      connection; it is NOT available through a pooled connection).
--   3. KnowledgeService.search is rewritten to a vector query and the
--      in-process cosine fallback is removed (or kept as a fallback flag).
--
-- Once applied, run `prisma db pull` / update schema.prisma to model the
-- vector column (Prisma has no native vector type; use Unsupported("vector(1536)")
-- or keep the Json column as the source of truth and mirror into the vector).
-- =============================================================================

-- CREATE EXTENSION IF NOT EXISTS vector;

-- ALTER TABLE "KnowledgeChunk" ADD COLUMN embedding_vec vector(1536);

-- CREATE INDEX kn_chunk_embedding_idx
--   ON "KnowledgeChunk" USING hnsw (embedding_vec vector_cosine_ops);

-- Populate from the existing Json embeddings (cosine search still possible here):
-- UPDATE "KnowledgeChunk"
--    SET embedding_vec = embedding::vector
--  WHERE embedding IS NOT NULL AND embedding_vec IS NULL;

-- Runtime query sketch (HNSW cosine):
-- SELECT id, content, 1 - (embedding_vec <=> $1::vector) AS similarity
--   FROM "KnowledgeChunk"
--  ORDER BY embedding_vec <=> $1::vector
--  LIMIT 8;
