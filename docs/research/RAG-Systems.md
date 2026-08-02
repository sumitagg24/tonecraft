# RAG Systems Research

## Overview
This document evaluates production RAG systems for ToneCraft, focusing on embedding strategies, chunking, metadata, reranking, hybrid search, citations, cost, and latency.

## Current ToneCraft RAG Architecture
- **Chunking**: Fixed-size chunks (2000 tokens) with 200-token overlap.
- **Extraction**: Supports 10+ file formats (PDF, DOCX, EXCEL, PPTX, JSON).
- **Storage**: Postgres with vector embeddings via Prisma ORM.
- **Search**: Hybrid search across chat history, prompts, and uploaded files.

## Comparison Table

| System | Embedding Strategy | Chunk Size | Metadata | Reranking | Hybrid Search | Citations | Cost | Latency | Implementation Difficulty | Maintenance Cost |
|--------|--------------------|-----------|----------|-----------|---------------|-----------|------|---------|---------------------------|------------------|
| **OpenAI File Search** | `text-embedding-3` (dense) | Automatic | ✅ Rich metadata | ✅ Built-in | ✅ | ✅ Native | $$$ ($5/$30 per 1M) | Low | 2 | 2 |
| **Claude Projects** | `text-embeddings-3` (sparse + dense) | Adaptive | ✅ | ✅ (thinking) | ✅ | ✅ Feedback API | $$$ ($5/$25) | Medium | 3 | 2 |
| **NotebookLM** | Google embeddings | Auto | ✅ | ✅ | ✅ | ✅ Citations | Free / $20/mo | Low | 1 | 1 |
| **Perplexity** | Proprietary retrieval | N/A | ✅ | ✅ | ✅ | ✅ Native | $$ (search API) | Low | 2 | 2 |
| **Cursor** | Code-aware embeddings | N/A | ✅ | ✅ | ✅ | ✅ | Free / $20/mo | Low | 1 | 1 |
| **Windsurf** | Codebase embeddings | N/A | ✅ | ✅ | ✅ | ✅ | Free / $20/mo | Low | 1 | 1 |
| **LangChain** | Pluggable (OpenAI, HuggingFace, etc.) | Configurable | ✅ | ✅ Via rerankers | ✅ | ✅ Via custom logic | $ (compute) | Medium | 4 | 3 |
| **LlamaIndex** | Pluggable | Configurable | ✅ | ✅ Via rerankers | ✅ | ✅ Via custom logic | $ (compute) | Medium | 4 | 3 |
| **pgvector** | Any (Postgres extension) | Configurable | ✅ Native | ✅ Via extensions | ✅ | ✅ Custom | Low | Medium | 3 | 2 |
| **Pinecone** | Managed embeddings | Configurable | ✅ Rich metadata | ✅ Built-in | ✅ | ✅ Custom | $$ (hosted) | Low | 2 | 3 |
| **Qdrant** | Any (native) | Configurable | ✅ Rich metadata | ✅ Via payload | ✅ | ✅ Custom | $$ (hosted) | Low | 3 | 3 |
| **Weaviate** | Any (native) | Configurable | ✅ Rich metadata | ✅ Via modules | ✅ | ✅ Custom | $$ (hosted) | Medium | 3 | 3 |

## Pros & Cons

### OpenAI File Search
- **Pros**: Fully managed, excellent embeddings, built-in citations, easy integration.
- **Cons**: Vendor lock-in, higher cost at scale, limited customization.

### Claude Projects
- **Pros**: Advanced reasoning, sparse + dense embeddings, strong safety.
- **Cons**: Newer API, limited file search maturity, higher cost.

### NotebookLM
- **Pros**: Free tier, strong citations, Google ecosystem.
- **Cons**: Limited API access, not production-grade for custom apps.

### Perplexity
- **Pros**: Real-time retrieval, strong citations, up-to-date info.
- **Cons**: Higher cost for search, limited generative capabilities.

### Cursor / Windsurf
- **Pros**: Code-aware, developer-friendly, free tiers.
- **Cons**: Not designed for general RAG, limited file types.

### LangChain / LlamaIndex
- **Pros**: Highly customizable, pluggable components, active community.
- **Cons**: Complex setup, higher maintenance, requires orchestration.

### pgvector
- **Pros**: Native Postgres, no additional infrastructure, cost-effective.
- **Cons**: Limited scalability vs dedicated vector DBs, manual reranking.

### Pinecone / Qdrant / Weaviate
- **Pros**: Managed vector DBs, rich metadata, scalable.
- **Cons**: Additional infrastructure cost, operational overhead.

## Recommendations for ToneCraft

### Embedding Strategy
1. **Primary**: Use `text-embedding-3` (OpenAI) for dense semantic embeddings.
2. **Secondary**: Combine with sparse embeddings (Claude) for cold-start efficiency.
3. **Future**: Implement adaptive chunking based on document type.

### Chunk Size Optimization
- **Current**: 2000 tokens with 200-token overlap — adequate for most use cases.
- **Improvement**: Add adaptive chunking:
  - Code/metrics files: ≤500 tokens per chunk.
  - Long documents: hierarchical chunking with metadata.
  - Tables/code: preserve structure in chunking.

### Metadata Tagging
Implement enriched metadata during chunk creation:

```
metadata: {
  source: string;
  doc_type: 'document' | 'table' | 'code';
  section_heading: string;
  page_number: number;
  embedding_model: string;
  chunk_type: 'content' | 'metadata' | 'reference'
}
```

### Hybrid Search Architecture
1. **Stage 1**: Fast ANN search via `searchScore()`.
2. **Stage 2**: Re-ranking using BERTScore, metadata relevance, and heading proximity.
3. **Stage 3**: Citation index in search results.

### Cost & Latency
- **Lowest cost**: pgvector with OpenAI embeddings (self-hosted).
- **Lowest latency**: Pinecone or Qdrant managed service.
- **Best balance**: OpenAI File Search for simplicity; pgvector for cost control.

## Implementation Difficulty
- **Easy** (1–2 days): Metadata tagging, basic hybrid search.
- **Medium** (3–5 days): Adaptive chunking, reranking pipeline.
- **Hard** (1–2 weeks): Full citation system, multi-stage retrieval.

## Maintenance Cost
- **Low**: OpenAI File Search, NotebookLM.
- **Medium**: pgvector, Pinecone.
- **High**: LangChain/LlamaIndex custom pipelines.

## Security Considerations
- **Data residency**: OpenAI, Anthropic, Google offer region-specific processing.
- **Encryption**: All providers support TLS; verify at-rest encryption for vector DBs.
- **Access control**: Implement user-scoped chunk storage; never share chunks across users.
- **Compliance**: Ensure GDPR/SOC 2 alignment for enterprise tiers.

## Sources / References
- OpenAI embeddings: https://platform.openai.com/docs/guides/embeddings
- pgvector: https://github.com/pgvector/pgvector
- Pinecone: https://www.pinecone.io/
- Qdrant: https://qdrant.tech/
- Weaviate: https://weaviate.io/
- LangChain: https://langchain.com/
- LlamaIndex: https://www.llamaindex.ai/