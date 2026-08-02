# AI Providers Research — Part 2 (6 of 13)

> ToneCraft AI Writing Assistant — Next.js 16 + Vercel AI SDK
> Research date: 2026-08-02. All pricing in USD per 1M tokens unless noted.
> Part 1 (OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Together AI) is in `ai-providers-research-part1.md`.

---

## 7. Fireworks

### Pricing (per 1M tokens, serverless)
| Model | Input | Output | Notes |
|---|---|---|---|
| Llama 3.1 8B | ~0.10 | ~0.10 | Size-tiered pricing |
| Llama 3.3 70B | ~0.20 | ~0.60 | Size-tiered pricing |
| Llama 4 Scout 17B | ~0.50 | ~1.50 | Vision-capable |
| DeepSeek V4 Flash | $0.15 | $0.218 (cached) | Priority serving 1.25–1.5x |
| Kimi K2.7 Code | $0.95 | $3.99 | |
| Qwen 3.7 Plus | $0.40 | $1.60 | |
| GLM 5.2 | $1.40 | $4.40 | |

- $1 in free credits on signup (no credit card required to start) [Fireworks Pricing](https://fireworks.ai/pricing)
- On-demand GPU pricing: $7.00/hr H100/H200 (rising to $10.00/hr May 1), $9.00/hr B200, $11.00/hr B300 [Fireworks Pricing](https://fireworks.ai/pricing)
- Serverless rates scale by model parameter count; cached input at 50% discount; batch at 50% discount [CostBench](https://costbench.com/software/llm-api-providers/fireworks-ai/)
- Priority serving tier at ~1.25x standard rate for lower latency [MorphLLM](https://www.morphllm.com/fireworks-ai-pricing)

### Rate Limits
- **Spending-tier ladder**: no payment method → 10 RPM account-wide; Tier 1 ($50/month cap), Tier 2 ($500), Tier 3 ($5,000), Tier 4 ($50,000) [AIPromptsHub](https://aipromptshub.co/limits/fireworks-rate-limits)
- Default per-model serverless ceiling: ~600 RPM (10 RPS) for new accounts [AIPromptsHub](https://aipromptshub.co/limits/fireworks-rate-limits)
- Account-wide hard ceiling: 6,000 RPM across all serverless traffic [AIPromptsHub](https://aipromptshub.co/limits/fireworks-rate-limits)
- On-demand deployments: no rate limit other than deployment capacity [AIPromptsHub](https://aipromptshub.co/limits/fireworks-rate-limits)
- Returns HTTP 429 with Retry-After header [Tickerr](https://tickerr.ai/pricing/fireworks)
- 503 = capacity issue (not your fault); 429 = rate limit [AIPromptsHub](https://aipromptshub.co/limits/fireworks-rate-limits)

### Streaming Support
Yes. SSE streaming via OpenAI-compatible `/chat/completions` endpoint with `stream=true`. Also supports streaming via Responses API beta. Streaming works with tool calls and reasoning tokens [OpenRouter Streaming](https://openrouter.ai/docs/guides/features/tool-calling)

### Vision
Supported on **Llama 4 Scout** and **Llama 4 Maverick** (preview models). Accepts up to 5 images per request, 20MB max per request. Vision token pricing is included in standard input token pricing. Not all Fireworks models support vision [Fireworks Pricing](https://fireworks.ai/pricing)

### Reasoning
Depends on model. **GPT-OSS** models and **Qwen3** support reasoning. Reasoning tokens included in output token counts, billed at output rates. No explicit reasoning effort parameter — thinking is model-dependent and automatic on supported models [Fireworks Pricing](https://fireworks.ai/pricing)

### JSON Mode
Depends on model. Models supporting OpenAI-compatible API accept `response_format: { type: "json_object" }` for JSON mode. Structured output enforcement depends on the model [Fireworks Docs](https://docs.fireworks.ai/serverless/pricing)

### Tool Calling
Yes. Models supporting the OpenAI-compatible API accept the `tools` parameter for function calling. Parallel tool calls supported via `parallel_tool_calls: true/false`. Streaming tool calls supported. **FireFunction V2** is Fireworks' specialized function-calling model [Fireworks Pricing](https://fireworks.ai/pricing)

### Context Window
Varies by model: Llama 3.3 70B (128K), Llama 4 Scout (128K+), Qwen3 32B (131K), DeepSeek V4 (128K–200K+). Most models support 128K context [Fireworks Models](https://fireworks.ai/models)

### Free Tier / Free API Credits
**$1 free credits** on signup (no credit card required). Free tier is for evaluation; production requires adding a payment method and entering a spending tier [Fireworks Pricing](https://fireworks.ai/pricing)

### Best Models (Top 3)
1. **DeepSeek V4 Flash** — Best cost-performance at $0.15/$0.12 per 1M; strong reasoning capabilities
2. **Llama 3.3 70B** — Good balance of quality and speed at $0.20/$0.60 per 1M
3. **Llama 4 Scout 17B** — Cost-effective vision-capable model at ~$0.50/~$1.50 per 1M

### Recommended Use Case for ToneCraft
Secondary provider for **budget-conscious, high-volume writing tasks**. DeepSeek V4 Flash is ideal for draft generation and tone analysis. Llama 3.3 70B for general rewrites. Use Llama 4 Scout when vision is needed (document image analysis). Best when cost optimization is priority over absolute quality.

---

## 8. Mistral

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| Mistral Large 3 | $0.50 | $1.50 | 262K |
| Mistral Medium 3.5 | $1.50 | $7.00 | 1M |
| Mistral Small 4 | $0.15 | $0.60 | 128K |
| Devstral 2 | $0.40 | $2.00 | 128K |
| Mistral Nemo | $0.02 | $0.06 | 128K |
| Codestral | Varies | Varies | 32K |
| Aya Expanse 23B | $0.50 | $1.50 | 128K |
| Aya Expanse 8B | $0.10 | $0.30 | 128K |

- Prompt caching: 90% discount on cached input tokens (0.15 → 0.015 on Large 3) [CloudZero](https://www.cloudzero.com/blog/mistral-api-pricing/)
- Batch API: 50% discount [Mistral Pricing](https://mistral.ai/pricing)

### Rate Limits
- **Tier-based**: Free (Experiment) → Tier 1 → Tier 2 → Tier 3 → Tier 4, progression based on API invoices [CloudZero](https://www.cloudzero.com/blog/mistral-api-pricing/)
- Free/Experiment tier: ~2 RPM, ~1 billion tokens/month [AgentDeals](https://agentdeals.dev/vendor/mistral-ai)
- Paid tiers: rate limits scale with spending [GrizzlyPeak](https://www.grizzlypeaksoftware.com/articles/p/mistral-ai-pricing-in-2026-pro-costs-free-tier-limits-and-api-rates-lx4o2n2v)
- Returns 429 with retry headers; implement exponential backoff [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)

### Streaming Support
Yes. SSE streaming via OpenAI-compatible `/chat/completions` endpoint with `stream=true`. Native SDKs handle streaming [Mistral Docs](https://docs.mistral.ai/)

### Vision
Yes. **Pixtral** family (Pixtral 24B, Pixtral Large) supports text+image input. Images passed as base64 or URL. Vision token pricing included in standard input pricing. Pixtral supports up to 32K context (Pixtral Large supports 128K) [Mistral Vision](https://mistral.ai/news/pixtral-vision-llm)

### Reasoning
**Mistral Medium 3.5** and **Mistral Large 3** support extended thinking/reasoning capabilities. No explicit `reasoning.effort` parameter — thinking is model-dependent. Reasoning tokens included in output token counts [Mistral Pricing](https://mistral.ai/pricing)

### JSON Mode
**Structured Outputs** via `response_format` parameter with JSON Schema. Works with most chat models. Supported on Medium 3.5 and Large 3 [Mistral Docs](https://docs.mistral.ai/capabilities/structured_output/)

### Tool Calling
Yes. Function calling via `tools` parameter. Supports parallel tool calls by default. `tool_choice: "auto"`, `"none"`, or specific function. Streaming tool calls supported [Mistral Docs](https://docs.mistral.ai/capabilities/tools/)

### Context Window
- **Mistral Medium 3.5**: 1M tokens
- **Mistral Large 3**: 262K tokens
- **Mistral Small 4**: 128K tokens
- Most models support 128K–1M context [Mistral Pricing](https://mistral.ai/pricing)

### Free Tier / Free API Credits
Yes. **Free Experiment tier**: no credit card required, 2 RPM, ~1 billion tokens/month. Rate-limited for evaluation only. Production requires paid tier [Mistral Pricing](https://mistral.ai/pricing) [AgentDeals](https://agentdeals.dev/vendor/mistral-ai)

### Best Models (Top 3)
1. **Mistral Large 3** — Flagship at $0.50/$1.50 per 1M; 262K context; best for complex writing tasks
2. **Mistral Medium 3.5** — $1.50/$7.00 per 1M; 1M context; strong reasoning and multilingual
3. **Mistral Nemo** — Ultra-cheap at $0.02/$0.06 per 1M; 128K context; best for high-volume, low-complexity tasks

### Recommended Use Case for ToneCraft
**Budget-friendly European alternative**. Mistral Nemo ($0.02/1M) is excellent for high-volume draft generation and tone analysis. Large 3 for premium rewriting. Pixtral for vision tasks (document image analysis). Strong GDPR compliance — ideal for European users. Consider as a cost-optimized provider alongside OpenAI/Anthropic.

---

## 9. DeepSeek

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| DeepSeek V4-Flash | $0.14 | $0.28 | 64K–128K |
| DeepSeek V4-Pro | $1.74 | $3.48 | 64K–128K |
| DeepSeek V3.2 (chat) | $0.28 | $0.42 | 128K |
| DeepSeek V3.2 (thinking) | $0.28 | $0.42 | 128K |
| DeepSeek R1 | $0.14 | $0.28 | 128K |

- V4-Pro promo pricing ($1.74/$3.48) expires May 31, 2026 — reverts to higher rates after [DLDT](https://tldl.io/resources/deepseek-api-pricing)
- Cache hits: 98% discount on cached input tokens [DLDT](https://tldl.io/resources/deepseek-api-pricing)
- No batch API pricing published [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)

### Rate Limits
- **No strict rate limits enforced** — serves every request it can handle [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
- Rate limits vary by account tier and tighten under traffic spikes
- Rate-limit info reported in response headers [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
- Implement retry logic with exponential backoff for 503s [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)

### Streaming Support
Yes. SSE streaming via OpenAI-compatible endpoint with `stream=true`. Supports streaming of `reasoning_content` (thinking tokens). [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)

### Vision
Limited. Primary focus is text-based LLM inference. Some models support multimodal inputs, but vision is not a primary focus compared to OpenAI, Anthropic, or Google [DeepSeek Docs](https://api-docs.deepseek.com/)

### Reasoning
Yes. DeepSeek V3 and V4 models support **thinking/reasoning mode**. V3.2-Thinking and R1 are reasoning-specialized models. Controlled via `reasoning_content` in streaming responses. Thinking tokens included in output token counts, billed at output rates. [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)

### JSON Mode
Yes. Supports `response_format: { type: "json_object" }` via OpenAI-compatible API. Structured outputs via tool calling with JSON schema enforcement [DeepSeek Docs](https://api-docs.deepseek.com/)

### Tool Calling
Yes. Function calling via `tools` parameter via OpenAI-compatible endpoint. Supports parallel tool calls. `tool_choice: "auto"` or specific function. Streaming tool calls supported [DeepSeek Docs](https://api-docs.deepseek.com/)

### Context Window
- **DeepSeek V4-Flash/Pro**: 64K–128K tokens (varies by model)
- **DeepSeek V3.2**: 128K tokens
- **DeepSeek R1**: 128K tokens
- Most DeepSeek models support 128K context [NxCove](https://nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)

### Free Tier / Free API Credits
Yes. **5 million free tokens** on signup (30-day validity, no credit card required). Consumer chat at `chat.deepseek.com` is completely free with unlimited access (subject to fair-use throttling). After free credits expire, pay-per-token with no minimum spend [DLDT](https://tldl.io/resources/deepseek-api-pricing)

### Best Models (Top 3)
1. **DeepSeek V4-Flash** — Cheapest serious model at $0.14/$0.28 per 1M; 35–100x cheaper than GPT-5.5/Claude for many tasks
2. **DeepSeek V4-Pro** — More capable reasoning at $1.74/$3.48 per 1M (promo pricing until May 31, 2026)
3. **DeepSeek V3.2** — Solid general-purpose model at $0.28/$0.42 per 1M; 128K context

### Recommended Use Case for ToneCraft
**Ultra-budget provider for high-volume tasks**. DeepSeek V4-Flash ($0.14/1M) is ideal for draft generation, tone analysis, and routine rewrites. 5M free tokens on signup enables easy prototyping. V4-Pro for complex reasoning tasks. Note: China-based provider — consider data residency requirements for enterprise users. Best as a tertiary/fallback provider for cost-sensitive workloads.

---

## 10. Cohere

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| Command A (Reasoning) | $2.50 | $10.00 | 1M |
| Command R+ 08-2024 | $2.50 | $10.00 | 128K |
| Command R 08-2024 | $0.15 | $0.60 | 128K |
| Command R7B | $0.0375 | $0.15 | 128K |
| Embed v3 English | $0.10 | (input only) | 128K |
| Embed v3 Multilingual | $0.10 | (input only) | 128K |
| Rerank v3 | $2.00 | (per 1M tokens of query+docs) | — |

- All Command models ship with 128K token context window [AIPricingGuru](https://www.aipricing.guru/cohere-pricing/)
- Rerank v3 priced at $2.00 per 1M tokens of query + document tokens [AIPricingGuru](https://www.aipricing.guru/cohere-pricing/)

### Rate Limits
- **Trial key (free)**: 20 req/min (Chat), 1,000 API calls/month total across all endpoints [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)
- **Production key**: 500 req/min (Chat), unlimited for standard endpoints [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)
- Trial key monthly cap (1,000 calls) is not per-endpoint — exhausts all endpoints [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)
- Returns HTTP 429 with Retry-After header; implement exponential backoff: wait 2^attempt seconds with ±20% jitter [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)

### Streaming Support
Yes. SSE streaming via official Cohere SDKs and REST API. Native streaming for Chat, Rerank, and Embed endpoints [Tickerr](https://tickerr.ai/pricing/cohere)

### Vision
No native vision in the Command family. **Command A Vision** exists but is evaluation-only (contact sales for production access) [AIPricingGuru](https://www.aipricing.guru/cohere-pricing/)

### Reasoning
Yes. **Command A** supports extended reasoning capabilities. However, reasoning/vision models are evaluation-only — contact sales for production access. Command R+ supports RAG-grounded reasoning [AIPricingGuru](https://www.aipricing.guru/cohere-pricing/)

### JSON Mode
Cohere does not have a native JSON mode. Uses **tool calling as JSON**: define a tool with JSON schema and set `tool_choice` to force structured output. No dedicated `response_format` parameter like OpenAI's Structured Outputs [AIPricingGuru](https://www.aipricing.guru/cohere-pricing/)

### Tool Calling
Yes. Function calling via `tools` parameter. Supports parallel tool calls. `tool_choice: "auto"`, `"none"`, or specific function. Streaming tool calls supported [Tickerr](https://tickerr.ai/pricing/cohere)

### Context Window
**128K tokens** across all Command models (R+, R, R7B) [Tickerr](https://tickerr.ai/pricing/cohere) [RapidDev](https://www.rapidevelopers.com/ai-api-limits-performance-matrix/cohere-command-r)

### Free Tier / Free API Credits
**Trial API key** (free, no credit card required):
- 100 API calls per minute
- 1,000 API calls per month total across all endpoints
- Access to all models including Command, Embed, and Rerank
- Rate-limited; not for production/commercial use [PECollective](https://pecollective.com/tools/cohere-pricing/) [Tickerr](https://tickerr.ai/pricing/cohere)

### Best Models (Top 3)
1. **Command R+** — Best writing quality at $2.50/$10 per 1M; 128K context; strong RAG and tool use
2. **Command R** — Best cost/performance at $0.15/$0.60 per 1M; 128K context; RAG-optimized
3. **Command R7B** — Cheapest at $0.0375/$0.15 per 1M; 128K context; lightweight tasks

### Recommended Use Case for ToneCraft
**RAG-specialized provider**. Cohere is purpose-built for retrieval-augmented generation — Command R/R+ excel at grounded writing (incorporating retrieved knowledge into responses). Command R7B ($0.0375/1M) is the cheapest production-grade chat model. Rerank v3 ($2/1M) available for retrieval quality improvement. Use as a specialized provider for knowledge-grounded writing tasks. Cohere's Embed v3 is also excellent for the RAG migration discussed in the Part 1 research.

---

## 11. Perplexity

### Pricing (per 1M tokens, API)
| Model | Input | Output | Notes |
|---|---|---|---|
| Sonar | $1.00 | $1.00 | Base search-augmented model |
| Sonar Pro | $3.00 | $15.00 | Higher-quality responses |
| Sonar Reasoning Pro | $2.00 | $8.00 | With reasoning |
| Sonar Deep Research | $2.00 | $8.00 | +$2/M citation + $3/M reasoning + $5/1K search queries |

- Web search and citations included in per-token price (no separate tool-use fees) [AIPricingGuru](https://www.aipricing.guru/perplexity-pricing/)
- **Per-request search fee** on addition to token costs (varies by search context: Low/Medium/High) [Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- Search request fees: `fast` = $6–$14/1K, `pro` = $14–$22/1K [Developer.Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- No monthly minimums on API [CostBench](https://costbench.com/software/llm-api-providers/perplexity-api/)

### Rate Limits
- **Free tier**: No standard free tier for API [CostBench](https://costbench.com/software/llm-api-providers/perplexity-api/)
- **Pro Search mode**: requires streaming; selected with `search_type` parameter [Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- Perplexity Pro subscribers ($20/month) previously received $5/month API credits — **removed in early 2026** without notice [CloudZero](https://www.cloudzero.com/blog/perplexity-api-pricing/)

### Streaming Support
Yes. SSE streaming supported. Pro Search mode requires streaming [Perplexity Docs](https://docs.perplexity.ai/guides/pricing)

### Vision
No native vision/multimodal input as of 2026 [AIPricingGuru](https://www.aipricing.guru/perplexity-pricing/)

### Reasoning
**Sonar Deep Research** and **Sonar Reasoning Pro** support extended reasoning/chain-of-thought [LMMarketCap](https://lmmarketcap.com/model/sonar-deep-research)

### JSON Mode
No dedicated JSON mode. Structured output via tool calling with JSON schema. No `response_format` parameter like OpenAI [Perplexity Docs](https://docs.perplexity.ai/guides/pricing)

### Tool Calling
Yes. Tool calling supported via the `tools` parameter. Citations are included in every response [Perplexity Docs](https://docs.perplexity.ai/guides/pricing)

### Context Window
**~127K tokens** (Sonar models) [CostBench](https://costbench.com/software/llm-api-providers/perplexity-api/) [LMMarketCap](https://lmmarketcap.com/model/sonar-deep-research)

### Free Tier / Free API Credits
- No standard free tier for the API
- **100 API calls per minute** on trial for new accounts [Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- Puter.js offers free access via a User-Pays model [Puter](https://developer.puter.com/tutorials/perplexity-api-pricing/)
- Perplexity Pro subscribers: $5/month API credits (removed in early 2026) [CloudZero](https://www.cloudzero.com/blog/perplexity-api-pricing/)

### Best Models (Top 3)
1. **Sonar** — Cheapest at $1/$1 per 1M; web search + citations included; best for cost-effective web-grounded writing
2. **Sonar Pro** — $3/$15 per 1M; higher-quality responses with web grounding
3. **Sonar Reasoning Pro** — $2/$8 per 1M; reasoning capabilities for complex web-researched tasks

### Recommended Use Case for ToneCraft
**Specialized research-backed writing provider**. Perplexity's value proposition is integrated web search + citations — ideal for writing tasks that need current information (news, trends, fact-checking). Sonar at $1/$1 is cost-effective for web-grounded content generation. Use when ToneCraft needs to generate content backed by recent web data. Not suitable as a general-purpose writing provider (no vision, no image input). Consider via OpenRouter (Perplexity models are available there too).

---

## 12. Cerebras

### Pricing (per 1M tokens, pay-as-you-go)
| Model | Input | Output | Notes |
|---|---|---|---|
| gpt-oss-120B | $0.35 | $0.75 | ~$0.39 blended [MorphLLM](https://www.morphllm.com/cerebras-pricing) |
| Llama 3.1 8B | $0.10 | $0.10 | [CostBench](https://costbench.com/software/llm-api-providers/cerebras-inference/) |
| Llama 3.3 70B | $0.85 | $1.20 | [CostBench](https://costbench.com/software/llm-api-providers/cerebras-inference/) |
| Qwen 3 32B | $0.40 | $0.80 | [CostBench](https://costbench.com/software/llm-api-providers/cerebras-inference/) |
| GLM-4.7 | $2.25 | $2.75 | [MorphLLM](https://www.morphllm.com/cerebras-pricing) |

- $5 in free credits on signup (Free Trial) [Cerebras Pricing](https://www.cerebras.ai/pricing)
- On-demand GPU: H100 $7/hr, B200 $9-10/hr, B300 $11-12/hr [Fireworks Pricing](https://fireworks.ai/pricing)
- Batch processing available at 50% discount [Cerebras Pricing](https://www.cerebras.ai/pricing)

### Rate Limits
- **Free tier (Forever Free)**: 5 RPM, 1M tokens/day (resets daily, doesn't accumulate) [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)
- **Developer tier**: 10x higher rate limits than free [Cerebras Pricing](https://www.cerebras.ai/pricing)
- **Free-tier context cap**: 8,192 tokens (temporary limit) [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)
- Returns 429 with Retry-After header on rate limit exceeded [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)

### Streaming Support
Yes. SSE streaming via OpenAI-compatible endpoint with `stream=true` [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)

### Vision
No — as of 2026, Cerebras focuses on text-only LLM inference. Text-only models [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026) [MorphLLM](https://www.morphllm.com/cerebras-pricing)

### Reasoning
Depends on the model. GPT-OSS models and Qwen models may support reasoning capabilities. Thinking tokens included in output token counts [MorphLLM](https://www.morphllm.com/cerebras-pricing)

### JSON Mode
Yes. Supports `response_format: { type: "json_object" }` via OpenAI-compatible API [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)

### Tool Calling
Yes. Function calling via `tools` parameter via OpenAI-compatible endpoint. Parallel tool calls supported (depends on underlying model) [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026)

### Context Window
- **gpt-oss-120B**: 131K tokens
- **Llama 3.1 8B**: 128K tokens
- **Llama 3.3 70B**: 128K tokens
- **Qwen 3 32B**: 128K tokens
- Free tier currently limited to 8K context (temporary) [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026) [MorphLLM](https://www.morphllm.com/cerebras-pricing)

### Free Tier / Free API Credits
Yes. **Forever Free tier** (no credit card required):
- 1,000,000 tokens per day (resets daily)
- 5 RPM, 30–100K tokens/minute (varies by model)
- 8,192 token context window (temporary limit)
- Access to all models (Llama 3.1 8B, GPT-OSS 120B, Qwen 3) [TokenMix](https://tokenmix.ai/blog/cerebras-api-key-rate-limits-free-tier-2026) [CostBench](https://costbench.com/software/llm-api-providers/cerebras-inference/)
- $5 free credits on signup (Free Trial) [Cerebras Pricing](https://www.cerebras.ai/pricing)

### Best Models (Top 3)
1. **gpt-oss-120B** — Best cost-performance at $0.35/$0.75 per 1M; 131K context; very fast inference (~2,000 tok/s)
2. **Llama 3.1 8B** — Ultra-cheap at $0.10/$0.10 per 1M; 128K context; best for high-volume, low-complexity tasks
3. **Llama 3.3 70B** — $0.85/$1.20 per 1M; good balance of quality and speed for standard writing tasks

### Recommended Use Case for ToneCraft
**Speed-optimized provider for latency-critical tasks**. Cerebras uses custom Wafer-Scale Engine (WSE) chips — ~20x faster than GPU-based inference on same model. The generous free tier (1M tokens/day, no credit card) is excellent for prototyping. Best when low-latency response is critical (real-time writing assistance). 8K context cap on free tier limits long-document work. Use as a high-speed secondary provider; not ideal as primary due to limited model selection and no vision.

---

# Provider Strategy for ToneCraft

## Current Coverage Summary (from Part 1 + Part 2)

| Provider | Already Integrated? | Env Var | SDK Package | Status |
|---|---|---|---|---|
| OpenAI | Via OpenRouter (OpenAI compat) | OPENAI_API_KEY | `@ai-sdk/openai` | Partial — direct access not configured |
| Anthropic | Via OpenRouter (OpenAI compat) | ANTHROPIC_API_KEY | Via `@ai-sdk/openai` | Partial — direct access not configured |
| Google Gemini | Yes | GOOGLE_AI_API_KEY | `@ai-sdk/google` | Active |
| OpenRouter | Yes | OPENROUTER_API_KEY | Via `@ai-sdk/openai` | Active |
| Groq | Yes | GROQ_API_KEY | `@ai-sdk/groq` | Active |
| Together AI | No | TOGETHER_API_KEY | `@ai-sdk/openai` (compat) | Recommended add |
| Fireworks | No | FIREWORKS_API_KEY | `@ai-sdk/openai` (compat) | Optional add |
| Mistral | No | MISTRAL_API_KEY | `@ai-sdk/openai` (compat) | Recommended add (EU) |
| DeepSeek | No | DEEPSEEK_API_KEY | `@ai-sdk/openai` (compat) | Optional add (budget) |
| Cohere | No | COHERE_API_KEY | `@ai-sdk/cohere` | Recommended add (RAG) |
| Perplexity | No | PERPLEXITY_API_KEY | Via OpenRouter or direct | Optional add (research) |
| Cerebras | No | CEREBRAS_API_KEY | `@ai-sdk/openai` (compat) | Optional add (speed) |

## Primary Providers per Intent Category

| Intent | Primary Provider | Model | Rationale |
|---|---|---|---|
| **rewrite** | OpenRouter (Claude Sonnet 4.6) | `anthropic/claude-3.7-sonnet` | Best nuance, style control, 1M context |
| **rewrite** (fallback) | Groq GPT-OSS 20B | `gpt-oss-20b` | Ultra-low cost, high speed |
| **reply** | Anthropic (direct) | `claude-3-7-sonnet-20250219` | Conversational nuance, multi-platform tone |
| **reply** (fallback) | OpenRouter GPT-5.5 | `openai/gpt-5.5` | Broad capability coverage |
| **social** | Google Gemini 3.5 Flash | `gemini-3.5-flash` | Fast, creative, 1M context for social content |
| **email** | OpenRouter GPT-5.5 | `openai/gpt-5.5` | Professional quality, long-context support |
| **grammar** | Groq GPT-OSS 20B | `gpt-oss-20b` | Fast, cheap for routine grammar fixes |
| **translate** | Google Gemini 3.5 Flash | `gemini-3.5-flash` | Strong multilingual, 1M context |
| **summarize** | OpenRouter Claude 3.7 Sonnet | `anthropic/claude-3.7-sonnet` | Strong summarization, long context |
| **enhance** | Anthropic (direct) | `claude-3-7-sonnet-20250219` | Creative enhancement, nuanced improvement |
| **cover-letter** | OpenRouter Claude 3.7 Sonnet | `anthropic/claude-3.7-sonnet` | High-quality professional writing |
| **resume** | OpenRouter Claude 3.7 Sonnet | `anthropic/claude-3.7-sonnet` | Precision, industry-specific language |
| **custom** | OpenRouter GPT-5.5 | `openai/gpt-5.5` | General-purpose flexibility |
| **vision** (documents) | Google Gemini 3.5 Flash | `gemini-3.5-flash` | Native multimodal, Agentic Vision |
| **vision** (fallback) | Fireworks Llama 4 Scout | — | When Gemini is rate-limited |

## Fallback Chain Ordering

Priority-based fallback (auto-model selection):

1. **Primary**: Google Gemini 3.5 Flash (free, fast, capable, 1M context)
2. **Secondary**: OpenRouter Claude 3.7 Sonnet (pro tier, highest quality)
3. **Tertiary**: Groq GPT-OSS 20B (ultra-cheap, high-speed, when quality < cost)
4. **Quaternary**: Mistral Nemo (EU-compliant, $0.02/1M for high-volume)
5. **Quinternary**: DeepSeek V4-Flash (budget, when all else fails)

This chain prioritizes cost (free/cheap first) while ensuring quality fallbacks for Pro users.

## Vision Provider

**Primary**: Google Gemini 3.5 Flash (`gemini-3.5-flash`) — natively multimodal, Agentic Vision in Gemini 3 Flash, `$0.30/$2.50` per 1M tokens, 1M context window.

**Secondary**: OpenRouter GPT-5.5 (when accessed via OpenRouter, vision-enabled models like `openai/gpt-4o` are available) — `$5/$30` per 1M tokens but best vision quality.

**Fallback**: Fireworks Llama 4 Scout — lower cost for vision tasks where premium quality isn't required.

## Reasoning-Heavy Provider

**Primary**: OpenRouter Claude 3.7 Sonnet (`anthropic/claude-3.7-sonnet`) — extended thinking via `thinking` parameter, `$3/$15` per 1M tokens, 1M context.

**Secondary**: Google Gemini 3.5 Flash — automatic thinking tokens, `$1.50/$9` per 1M tokens.

**Budget**: DeepSeek V4-Pro / R1 — reasoning-capable at `$0.14/$0.28` per 1M tokens, but quality trade-off.

## Cost-vs-Speed Trade-off Recommendations

| Need | Recommended Provider | Model | Cost/1M | Speed |
|---|---|---|---|---|
| Best quality | OpenRouter | Claude 3.7 Sonnet | $3/$15 | Medium |
| Best quality/cost | Google | Gemini 3.5 Flash | $1.50/$9 | Fast |
| Fastest response | Groq | GPT-OSS 20B | $0.075/$0.30 | Very fast (500–1000 TPS) |
| Cheapest | Mistral | Nemo | $0.02/$0.06 | Medium |
| Cheapest (reasoning) | DeepSeek | V4-Flash | $0.14/$0.28 | Medium-fast |
| Fastest (ultra) | Cerebras | gpt-oss-120B | $0.35/$0.75 | Ultra (>2000 tok/s) |
| Web-grounded | Perplexity | Sonar | $1/$1 (+search fee) | Fast |

## New Integrations to Add

1. **Direct Anthropic SDK** (`@ai-sdk/anthropic`) — currently using Anthropic via OpenRouter's OpenAI-compatible endpoint. Direct integration gives better error handling, native thinking mode support, and avoids OpenRouter's 5.5% platform fee. Add `ANTHROPIC_API_KEY` (already in `.env.example`).

2. **Direct OpenAI SDK** (`@ai-sdk/openai`) — currently using OpenAI models via OpenRouter. Direct access gives better rate limits, native structured outputs, and o-series reasoning support. Add `OPENAI_API_KEY` (already in `.env.example`).

3. **Cohere SDK** (`@ai-sdk/cohere`) — for RAG-specialized writing and the Rerank v3 neural reranker. Add `COHERE_API_KEY`.

4. **Mistral SDK** (`@ai-sdk/openai` with Mistral endpoint) — for EU data residency and ultra-budget Nemo model. Add `MISTRAL_API_KEY`.

5. **DeepSeek SDK** (`@ai-sdk/openai` with DeepSeek endpoint) — for ultra-budget V4-Flash. Add `DEEPSEEK_API_KEY`.

## Provider Architecture Update

ToneCraft's `ProviderRouter.ts` should be updated to:
- Add direct Anthropic and OpenAI clients alongside OpenRouter
- Add health checks for Cohere, Mistral, DeepSeek, Cerebras
- Extend the `capabilities` ranking system to weight by cost-to-quality ratio
- Implement cost-aware routing: route to cheaper providers for simple tasks, premium providers for complex tasks
- Add provider preference by region (e.g., Mistral for EU users based on data residency)

The existing `models.ts` config is well-structured for adding new providers. New model entries should follow the same `ModelEntry` schema with appropriate `creditCost` values reflecting the relative token costs.