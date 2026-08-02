# ADR-008: Knowledge System

## Status
Accepted

## Context
ToneCraft supports uploading documents (PDF, DOCX, etc.) for AI-assisted writing. The knowledge system provides retrieval-augmented generation (RAG) with citations, hybrid keyword + semantic search, and metadata enrichment for source attribution.

## Decision
Store document chunks with embeddings in Postgres using pgvector. Implement hybrid search combining BM25 keyword matching with vector similarity. Chunks include enriched metadata: source file, section headings, document ID, hash, language, and tags.

## Alternatives Considered
1. Pinecone/Weaviate - Managed vector service but adds vendor risk.
2. Keyword-only search - Faster but lower recall.
3. Dense embeddings only - Misses keyword hits for exact matches.

## Tradeoffs
- Pro: Self-hosted vectors reduce lock-in; dual-indexing improves recall.
- Con: pgvector requires careful index tuning; storage overhead for embeddings.

## Consequences
All knowledge documents pass through extraction pipeline before chunking. Search results include metadata for inline citations. Embeddings are refreshed on document re-upload. Future enhancement may add reranking via small cross-encoder.