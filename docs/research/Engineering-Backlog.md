# Phase 8 Research Review

## Classification Legend
- **Immediate**: < 1 day
- **Near-term**: 1–7 days
- **Mid-term**: 1–14 days
- **Long-term**: > 14 days

## Backlog Items

| Recommendation | Classification | Why | Business Value | Engineering Effort | Dependencies | Risk | Recommended Phase | Est. Dev Time |
|---|---|---|---|---|---|---|---|---|
| Hybrid Search Pipeline | Near-term | Enhances relevance by combining keyword and semantic search, reduces hallucinations | Higher user satisfaction, higher conversion, reduced support | Medium | Embedding consistency, SearchService refactor, API endpoint for reranking | Increased latency under load | Phase 8 | 2–3 weeks |
| Enriched Metadata Tagging | Immediate | Captures source, headings, section, document ID, hash, tags for each chunk | Enables accurate citations, improves traceability, supports compliance | Low | Chunk creation pipeline, storage schema | Slight storage overhead | Phase 8 | 3–5 days |
| Adaptive Chunking Strategy | Near-term | Splits content by logical structures (headings, lists, tables, code blocks) instead of fixed size | Better context preservation, higher retrieval accuracy | Medium | File parsers, chunking pipeline | Increased complexity | Phase 8 | 1–2 weeks |
| Provider Switch UI | Near-term | Allows users to select or switch AI providers and view usage credits | Differentiates product, improves user control | Medium | UI components, routing configuration, settings storage | UI state management | Phase 8 | 1–2 weeks |
| Feature Flag System | Immediate | Enables safe rollouts and A/B testing of new features | Reduces deployment risk, faster iteration | Low | LaunchDarkly or internal flag service | Technical debt if overused | Phase 8 | 1–2 days |
| Better Metadata (Additional fields) | Immediate | Add fields: Project, Folder, Filename, Heading, Section, Created, Updated, Language, Chunk #, Document ID, Hash, Source URL, Tags | Improves search relevance and user trust | Low | Extend chunk model, update extraction pipeline | Minimal | Phase 8 | 2–3 days |
| Model Registry Integration | Mid-term | Central registry to track model versions, capabilities, costs | Enables dynamic provider routing, cost optimization | Medium | Backend service, API, storage | Coordination complexity | Phase 9 | 3–4 weeks |
| Capability Registry | Mid-term | Catalog of provider capabilities (e.g., vision, JSON mode) | Drives intelligent routing decisions | Medium | Integration with Model Registry, UI | Maintenance overhead | Phase 9 | 3–4 weeks |
| Credits System Enhancements | Immediate | Transparent usage meters, rollover, bulk discounts | Improves pricing clarity, encourages higher tiers | Low | Billing integration, UI display | Accuracy of metering | Phase 8 | 2–3 days |
| Provider Router (Smart Selection) | Near-term | Choose cheapest capable model based on task, fallback routing, user prefs, health, credits | Cost efficiency, resilience, user satisfaction | Medium | Routing logic, monitoring, fallbacks | Incorrect selection leading to subpar output | Phase 8 | 1–2 weeks |
| Existing Already Implemented Items | — | Items already in production (e.g., Paddle billing, Clerk auth) | No additional work needed | None | None | None | Already Implemented | — |
| Rejected Recommendations | — | HIPAA, BAA, Healthcare module, Fine-tuning, API marketplace, Vendor lock‑in avoidance | Out of scope for current phase | — | — | — | Rejected | — |

## Conflict Detection
- No recommendations conflict with existing architecture. All align with multi‑provider design.

## Duplicate Detection
- No duplicate recommendations identified.

**Note:** Classification reflects effort needed to turn each recommendation into a shippable feature. Estimated development time assumes focused effort without parallelization.