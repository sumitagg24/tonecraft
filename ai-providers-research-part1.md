# AI Providers Research — Part 1 (6 of 13)

> ToneCraft AI Writing Assistant — Next.js 16 + Vercel AI SDK
> Research date: 2026-08-02. All pricing in USD per 1M tokens unless noted.

---

## 1. OpenAI

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| GPT-5.6 Sol (flagship) | $5.00 | $30.00 | 1.05M |
| GPT-5.6 Terra | $2.00 | $12.00 | 1.05M |
| GPT-5.6 Luna | $0.20 | $1.20 | 1.05M |
| GPT-5.5 | $5.00 | $30.00 | 1M |
| GPT-5.4 | $2.50 | $15.00 | 1.05M |
| GPT-5.4 Mini | $0.75 | $4.50 | 400K |
| GPT-5.4 Nano | $0.20 | $1.25 | 400K |
| o4-mini (reasoning) | $1.10 | $4.40 | 200K |
| o3 (reasoning) | $2.00 | $8.00 | 200K |

Long-context (>270K input) triggers 2x input / 1.5x output surcharges. Batch API cuts rates by 50%. Cached input at 10% of standard. [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)

### Rate Limits
- **Tier-based** (Free/Tier 1/Tier 2/Tier 3/Tier 4). Free tier: 50 RPM, 50K ITPM, 10K OTPM, $100/day cap. Tier 4: 4,000 RPM, 2M ITPM, 400K OTPM, no daily cap. Enterprise: custom. [Anthropic Rate Limits](https://platform.claude.com/docs/en/api/rate-limits) — *note: OpenAI uses a single TPM bucket (input+output combined), unlike Anthropic's separate ITPM/OTPM.*
- OpenAI returns `429` with `retry-after` header. Rate limits apply per organization. [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

### Streaming Support
Yes. HTTP streaming via `stream=true` in both Chat Completions and Responses APIs. Server-Sent Events (SSE) with typed events (`response.output_text.delta`, `response.function_call_arguments.delta`, etc.). SDKs handle streaming natively. [OpenAI Streaming](https://developers.openai.com/api/docs/guides/streaming-responses)

### Vision
Yes. GPT-4o, GPT-4.1, GPT-5.x support text+image input. Images billed as tokens: base 85 tokens per image (low detail) + 170 per 512×512 tile (high detail). GPT-4o-mini vision costs ~2,833 base tokens per image. GPT-4o vision costs 85 base + 170/tile. [OpenAI Vision Pricing](https://developers.openai.com/api/docs/pricing)

### Reasoning
Yes. GPT-5.x and o-series models support internal reasoning tokens. Controlled via:
- `reasoning.effort`: `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` (model-dependent)
- `reasoning.mode`: `standard` (default) or `pro` (GPT-5.6 Sol/Pro)
- `reasoning.context`: `current_turn` or `all_turns` (GPT-5.6 defaults to `all_turns`)
Reasoning tokens billed at the model's standard token rates. [OpenAI Reasoning](https://developers.openai.com/api/docs/guides/reasoning)

### JSON Mode
Two options:
1. **Structured Outputs** (recommended): `text.format = { type: "json_schema", strict: true, schema: {...} }` in the Responses API. Enforces schema adherence. Supported on GPT-4o-mini and later.
2. **JSON Mode** (legacy): `text.format = { type: "json_object" }`. Ensures valid JSON but no schema enforcement. Requires "JSON" in the prompt or API throws an error.
Both work with streaming and the SDKs (`client.responses.create()` / `client.chat.completions.create()`). [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

### Tool Calling
Yes. Function calling via `tools` parameter in Chat Completions and Responses APIs. Parallel tool calls supported on GPT-5.x (built-in tools excluded from parallel batches). `tool_choice: "auto"` (default), `"none"`, or specific function. `strict: true` enforces schema compliance. Streaming tool calls supported via `stream=true`. [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)

### Context Window
**1.05M tokens** (GPT-5.6 Sol/Terra/Luna). GPT-5.5 and GPT-5.4 Pro also support 1M. Standard pricing applies to first ~270K input tokens; long-context rates beyond that. [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)

### Free Tier / Free API Credits
No free tier for the API. Pay-as-you-go with a $5 minimum initial deposit. Free credits are not offered. [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)

### Best Models (Top 3)
1. **GPT-5.6 Sol** — Flagship reasoning + general intelligence; best for complex writing tasks requiring nuance and planning.
2. **GPT-5.5** — Strong general-purpose model at $5/$30 per 1M; excellent balance of quality and cost for writing.
3. **GPT-5.4 Mini** — High-volume, cost-effective writing at $0.75/$4.50 per 1M; ideal for draft generation and routine content.

### Recommended Use Case for ToneCraft
GPT-5.4 Mini for draft generation and routine writing (low cost, high throughput). GPT-5.5 or GPT-5.6 Sol for complex rewriting, style transfer, and reasoning-heavy tasks (planning, structure, coherence). Structured Outputs for generating JSON-formatted writing metadata (tone scores, readability metrics, style tags).

---

## 2. Anthropic (Claude)

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| Claude Opus 4.7 | $5.00 | $25.00 | 1M |
| Claude Opus 4.6 | $5.00 | $25.00 | 1M |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 1M |
| Claude Sonnet 5 (intro, through Aug 31 2026) | $2.00 | $10.00 | 1M |
| Claude Sonnet 5 (standard, from Sep 1 2026) | $3.00 | $15.00 | 1M |
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K |
| Claude Haiku 3.5 (retired) | $0.80 | $4.00 | 200K |

Claude 4.7+ models use a newer tokenizer (~30% more tokens per same text). Prompt caching: 5-min cache writes at $6.25/$10.00, 1-hr cache writes at $10.00/$20.00, cache hits at $0.50/$1.00 (Opus 4.7). Batch processing at 50% discount. [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Rate Limits
Three independent counters: **RPM**, **ITPM** (input tokens/min), **OTPM** (output tokens/min). Rate limits scale by usage tier:

| Tier | Spend Req | Days Req | RPM | ITPM | OTPM | Daily $ |
|---|---|---|---|---|---|---|
| Tier 1 | $0 | 0 | 50 | 30K | 8K | $100 |
| Tier 2 | $40 | 7 | 1,000 | 80K | 16K | $500 |
| Tier 3 | $200 | 7 | 2,000 | 160K | 32K | $1,000 |
| Tier 4 | $400 | 14 | 4,000 | 400K | 80K | None |

OTPM is typically the binding constraint for writing workloads. Returns `429` with `retry-after` header. [Anthropic Rate Limits](https://platform.claude.com/docs/en/api/rate-limits)

### Streaming Support
Yes. SSE streaming via `stream=true` in the Messages API. Events include `content_block_delta` (text chunks), `message_delta`, and `message_stop`. SDKs handle streaming natively (`client.messages.stream()`). [Anthropic Streaming](https://platform.claude.com/docs/en/api/messages)

### Vision
Yes. Claude accepts images as `image` content blocks (base64, URL, or `file_id`). Supports up to 600 images per request (100 for 200K context models). Max image size 8000×8000 px, 10 MB base64-encoded. Vision token cost is included in the standard input token pricing (no separate vision surcharge). [Claude Vision](https://platform.claude.com/docs/en/build-with-claude/vision)

### Reasoning
Yes. Claude supports **extended thinking** (chain-of-thought). Controlled via:
- `thinking: { type: "adaptive", display: "summarized" | "detailed" }` — adaptive thinking that adjusts depth based on task complexity
- `thinking: { type: "enabled", budget_tokens: N }` — fixed thinking budget
Thinking tokens billed as output tokens. Available on Claude 3.7 Sonnet and later (Opus 4.x, Sonnet 4.x, Haiku 4.5). [Claude Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)

### JSON Mode
Claude does not have a native JSON mode like OpenAI. Instead:
1. **System prompt instruction**: Instruct the model to output valid JSON.
2. **Tool calling as JSON**: Define a tool with a JSON schema and set `tool_choice: { type: "tool", tool_name: "output_json" }` — the model calls the tool with structured JSON arguments.
3. **Structured outputs via SDK**: Use the `Anthropic` SDK with system prompts enforcing JSON format.
No dedicated `response_format` parameter like OpenAI's Structured Outputs. [Claude Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)

### Tool Calling
Yes. Function calling via `tools` parameter in the Messages API. Supports parallel tool calls by default (`disable_parallel_tool_use: true` to restrict to one at a time). `tool_choice: "auto"` (default), `"none"`, `"any"`, or specific tool. Tool definitions use JSON Schema for input validation. [Claude Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling)

### Context Window
**1M tokens** (Claude Opus 4.6+, Sonnet 4.6+, Haiku 4.5). Claude 4.7+ models include the full 1M context at standard pricing (no long-context surcharge). Older models (Opus 4.1, Sonnet 4) have 200K context at standard pricing, with 1M available at higher rates. [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Free Tier / Free API Credits
No free tier for the API. Requires a credit card and minimum spend. No free API credits are offered. [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Best Models (Top 3)
1. **Claude Opus 4.7** — Highest reasoning and writing quality; best for complex, nuanced writing tasks and agentic workflows.
2. **Claude Sonnet 4.6** — Balanced quality and cost at $3/$15 per 1M; excellent for instruction-following and nuanced writing.
3. **Claude Haiku 4.5** — Fastest and cheapest at $1/$5 per 1M; ideal for high-volume, low-complexity writing tasks.

### Recommended Use Case for ToneCraft
Claude Sonnet 4.6 for the primary writing engine (nuanced style control, instruction-following, 1M context for long documents). Claude Haiku 4.5 for fast, high-volume tasks like tone analysis and readability scoring. Opus 4.7 for complex rewriting and planning tasks where quality justifies the cost.

---

## 3. Google Gemini

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| Gemini 3.1 Pro Preview | $2.00 | $12.00 | 1M (2M for >200K) |
| Gemini 3.5 Flash | $1.50 | $9.00 | 1M |
| Gemini 2.5 Pro | $1.25 | $10.00 | 2M |
| Gemini 2.5 Flash | $0.30 | $2.50 | 1M |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | 1M |
| Gemini 3 Flash Preview | $0.50 | $3.00 | 1M |

>200K input tokens: 2x input / 1.5x output rates. Cached input at 10% of standard. Batch API at 50% discount. Context caching at $0.15/1M tokens/hour storage. Grounding with Google Search: 5,000 free prompts/month, then $14/1,000 queries. [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Rate Limits
Applied per Google Cloud project (not per API key). Three dimensions: **RPM**, **TPM** (tokens per minute, input+output combined), **RPD** (requests per day). Spend-based limits also apply on a rolling 10-minute window:

| Tier | Qualification | Spend Rate (per 10 min) |
|---|---|---|
| Free | Active project | N/A |
| Tier 1 | Linked billing account | $10 |
| Tier 2 | $100+ paid, 3+ days | $200 |
| Tier 3 | $1,000+ paid, 30+ days | $200 |

Free tier: ~2–15 RPM depending on model. Paid tiers get significantly higher limits. Priority consumption (dedicated capacity) has its own rate limits at 0.3x standard. [Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)

### Streaming Support
Yes. SSE streaming via `stream=true` in the Interactions API. Events include `step.delta` (text, tool calls, thinking), `step.start`, `step.stop`, and `interaction.completed`. SDKs handle streaming natively (`client.interactions.create(stream=True)`). [Gemini Streaming](https://ai.google.dev/gemini-api/docs/streaming)

### Vision
Yes. Gemini is natively multimodal — accepts text, image, video, and audio in a single request. Images passed as `image` content blocks (URL, base64, or File API). Supports up to 3,600 images per request. `media_resolution` parameter controls token allocation per image: `low` (280 tokens), `medium` (560), `high` (1,120), `ultra_high` (2,240). Gemini 3 Flash includes **Agentic Vision** — the model can execute code to manipulate and analyze images iteratively. [Gemini Vision](https://ai.google.dev/gemini-api/docs/image-understanding)

### Reasoning
Yes. Gemini models use **thinking tokens** (chain-of-thought) that are included in the output token count and billed at output rates. Controlled via:
- `thinkingConfig: { thinkingBudget: N }` — sets the thinking token budget
- `thinking_summaries` — enables streaming of reasoning summaries
- Gemini 3 models support thinking natively; earlier models may not.
No explicit toggle like OpenAI's `reasoning.effort` — thinking is model-dependent and automatic. [Gemini Thinking](https://ai.google.dev/gemini-api/docs/thinking)

### JSON Mode
Yes. **Structured Outputs** via `response_format` in the Interactions API:
```python
response_format={
    "type": "text",
    "mime_type": "application/json",
    "schema": Feedback.model_json_schema()
}
```
Supports JSON Schema subset (string, number, integer, boolean, object, array, null, enum, format). Works with Pydantic (Python) and Zod (JavaScript) SDKs. Streaming structured outputs supported — chunks are valid partial JSON strings. Gemini 3 models also support combining structured outputs with function calling and tools. [Gemini Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)

### Tool Calling
Yes. Function calling via `tools` parameter in the Interactions API. Supports parallel tool calls by default. `tool_choice: "auto"` (default), `"any"`, `"none"`, or `"validated"` (preview — ensures schema validity). Streaming tool calls supported — function call arguments stream as `arguments_delta` events that must be accumulated. Also supports **remote MCP** (Model Context Protocol) for tool integration. [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)

### Context Window
**2M tokens** (Gemini 2.5 Pro). Gemini 3.1 Pro Preview supports 1M (2M for prompts >200K). Gemini 3.5 Flash and 3 Flash Preview support 1M. Gemini 2.5 Flash and Flash-Lite support 1M. [Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing)

### Free Tier / Free API Credits
Yes. **Google AI Studio** offers a free tier with Flash models at 5–15 RPM and up to 1,500 daily requests. Pro models were removed from the free tier on April 1, 2026. The free tier includes data logging (Google may use inputs/outputs to improve models). Paid tier removes data logging and offers higher limits. No startup credits are offered. [Gemini Free Tier](https://ai.google.dev/gemini-api/docs/pricing)

### Best Models (Top 3)
1. **Gemini 3.1 Pro Preview** — Highest capability for complex writing, long-context analysis, and reasoning at $2/$12 per 1M.
2. **Gemini 3.5 Flash** — Best balance of speed, quality, and cost at $1.50/$9.00 per 1M; launched May 2026 with strong coding and agentic capabilities.
3. **Gemini 2.5 Pro** — Premium reasoning with 2M context at $1.25/$10.00 per 1M; excellent for long-document writing assistance.

### Recommended Use Case for ToneCraft
Gemini 3.5 Flash for the primary writing engine (fast, cost-effective, strong general-purpose quality). Gemini 2.5 Pro for long-document analysis and rewriting (2M context window). Gemini 3.1 Pro Preview for complex, high-quality rewriting tasks requiring deep reasoning. Structured Outputs for generating JSON-formatted tone/style metadata. Agentic Vision (Gemini 3 Flash) for analyzing screenshots of writing or documents.

---

## 4. OpenRouter

### Pricing (per 1M tokens)
OpenRouter is a **model aggregator** that passes through provider pricing at or near cost. Pricing varies by the underlying model. Examples:

| Model | Provider | Input | Output | Context |
|---|---|---|---|---|
| GPT-5.5 | OpenAI | $5.00 | $30.00 | 1M |
| GPT-5.4 | OpenAI | $2.50 | $15.00 | 1.05M |
| GPT-5.4 Mini | OpenAI | $0.75 | $4.50 | 400K |
| Claude Opus 4.7 | Anthropic | $5.00 | $25.00 | 1M |
| Claude Sonnet 4.6 | Anthropic | $3.00 | $15.00 | 1M |
| Claude Haiku 4.5 | Anthropic | $1.00 | $5.00 | 200K |
| Gemini 3.1 Pro | Google | $2.00 | $12.00 | 1M |
| Gemini 3.5 Flash | Google | $1.50 | $9.00 | 1M |
| GPT-OSS-120B | OpenAI | $0.15 | $0.60 | 131K |
| Llama 3.3 70B | Meta | $0.13 | $0.20 | 131K |
| Qwen3.5 Plus | Alibaba | $0.26 | $1.56 | 1M |

OpenRouter charges **5.5% platform fee** on pay-as-you-go (waived on Enterprise). No monthly fees, no minimum spend. BYOK available with $250K/month list price inference at no fee (5% after). [OpenRouter Pricing](https://openrouter.ai/pricing)

### Rate Limits
- **Free tier**: 50 requests/day, 20 requests/minute. Applies to free models only.
- **Paid models**: No enforced rate limits from OpenRouter. Rate limits are enforced by the upstream provider (e.g., OpenAI, Anthropic, Google).
- **BYOK**: Rate limits depend on the upstream provider's limits.
- OpenRouter returns `429` with `Retry-After` header. Rate limits are global across all API keys for an account. [OpenRouter Rate Limits](https://openrouter.ai/docs/api_reference/limits)

### Streaming Support
Yes. OpenRouter supports SSE streaming for all models via the standard `/chat/completions` endpoint with `stream=true`. Also supports streaming via the Responses API beta. Streaming works with tool calls and reasoning tokens. SDKs (OpenRouter TypeScript SDK, OpenAI-compatible SDKs) handle streaming natively. [OpenRouter Streaming](https://openrouter.ai/docs/api/reference/streaming)

### Vision
Depends on the underlying model. Models like GPT-4o, GPT-4.1, Claude Opus/Sonnet, and Gemini 3.x support vision when accessed through OpenRouter. Images are passed the same way as the provider's native API (base64, URL, or file_id). Vision token pricing is the same as the underlying provider's pricing. [OpenRouter Tool Calling](https://openrouter.ai/docs/guides/features/tool-calling)

### Reasoning
Depends on the underlying model. Models like o3, o4-mini, GPT-5.x, and Claude Opus 4.x support reasoning when accessed through OpenRouter. Reasoning is controlled via the same parameters as the native API (`reasoning.effort`, `reasoning.mode` for OpenAI; `thinking` for Anthropic). OpenRouter's SDK provides `getReasoningStream()` for streaming reasoning tokens separately from text. [OpenRouter Reasoning](https://openrouter.ai/docs/sdks/typescript/call-model/streaming)

### JSON Mode
Depends on the underlying model. For OpenAI models: Structured Outputs and JSON mode work the same as native OpenAI API. For Anthropic models: use tool calling or system prompts to enforce JSON. For Gemini models: use `response_format` with JSON Schema. OpenRouter's SDK provides unified interfaces that work across providers. [OpenRouter JSON Mode](https://openrouter.ai/docs/guides/features/tool-calling)

### Tool Calling
Yes. OpenRouter standardizes the tool calling interface across all providers. Uses the same `tools` parameter format as the OpenAI Chat Completions API. Supports parallel tool calls (`parallel_tool_calls: true/false`). `tool_choice: "auto"`, `"none"`, or specific function. Streaming tool calls supported. OpenRouter tracks tool call success rates per model and auto-routes to the best provider. [OpenRouter Tool Calling](https://openrouter.ai/docs/guides/features/tool-calling)

### Context Window
Varies by model. Examples: GPT-5.6 Sol (1.05M), Claude Opus 4.7 (1M), Gemini 3.1 Pro (1M), Qwen3.5 Plus (1M), Llama 3.3 70B (131K). Check individual model pages on openrouter.ai/models. [OpenRouter Models](https://openrouter.ai/models)

### Free Tier / Free API Credits
25+ free models available with **50 requests/day** and **20 requests/minute** rate limits. If you purchase at least 10 credits, free model limits increase to 1,000 requests/day. No startup credits are offered. Platform fees are N/A for free tier. [OpenRouter FAQ](https://openrouter.ai/docs/faq)

### Best Models (Top 3)
1. **GPT-5.5** (via OpenAI) — Best overall writing quality and reasoning at $5/$30 per 1M.
2. **Claude Sonnet 4.6** (via Anthropic) — Best for nuanced, stylistic writing at $3/$15 per 1M.
3. **GPT-5.4 Mini** (via OpenAI) — Best cost-performance for high-volume writing at $0.75/$4.50 per 1M.

### Recommended Use Case for ToneCraft
OpenRouter is ideal for **multi-model routing** — use it to automatically failover between providers and access the best model for each task. Route complex rewriting to GPT-5.5 or Claude Sonnet 4.6, routine drafts to GPT-5.4 Mini, and high-volume analysis to free/open-source models like Llama 3.3 70B or Qwen3.5 Plus. The unified API simplifies integration with the Vercel AI SDK.

---

## 5. Groq

### Pricing (per 1M tokens)
| Model | Input | Output | Speed (TPS) | Context |
|---|---|---|---|---|
| Llama 3.1 8B Instant | $0.05 | $0.08 | 840 | 128K |
| GPT-OSS 20B | $0.075 | $0.30 | 1,000 | 128K |
| Llama 4 Scout 17B | $0.11 | $0.34 | ~600 | 128K |
| GPT-OSS 120B | $0.15 | $0.60 | 500 | 128K |
| Qwen3 32B | $0.29 | $0.59 | ~500 | 131K |
| Llama 3.3 70B Versatile | $0.59 | $0.79 | 394 | 128K |
| Kimi K2 Instruct | $1.00 | $3.00 | ~250 | — |

Batch API: 50% discount. Prompt caching: 50% discount on cached input tokens. Stacked discounts yield ~25% of on-demand pricing. [Groq Pricing](https://groq.com/pricing)

### Rate Limits
Rate limits are **per model** and **per organization** (not per API key). Two tiers:

| Tier | Model Example | RPM | RPD | TPM | TPD |
|---|---|---|---|---|---|
| Free | Llama 3.1 8B | 30 | 14,400 | 6,000 | 500K |
| Free | GPT-OSS 20B | 30 | 1,000 | 8,000 | 200K |
| Free | Llama 3.3 70B | 30 | 1,000 | 12,000 | 100K |
| Developer | Llama 3.1 8B | 1,000 | 500,000 | 250,000 | — |
| Developer | GPT-OSS 20B | 1,000 | 500,000 | 250,000 | — |
| Developer | Llama 3.3 70B | 1,000 | 300,000 | 300,000 | — |

Free tier requires **no credit card**. Developer plan requires a payment method. Returns HTTP 429 with `retry-after` header. Rate limits apply at the organization level — multiple API keys do not multiply quotas. [Groq Rate Limits](https://console.groq.com/docs/rate-limits)

### Streaming Support
Yes. Groq supports HTTP streaming via the OpenAI-compatible `/chat/completions` endpoint with `stream=true`. Returns SSE events with delta content. SDKs (OpenAI-compatible) handle streaming natively. [Groq Docs](https://console.groq.com/docs)

### Vision
Limited. Vision is supported on **Llama 4 Scout** and **Llama 4 Maverick** (preview models). These models accept image inputs alongside text. Maximum 5 images per request, 20MB max per request. Vision token pricing is included in the standard input token pricing. Not all Groq models support vision — check model compatibility before use. [Groq Vision](https://console.groq.com/docs/vision)

### Reasoning
Yes. **Qwen3.6-27B** supports thinking/non-thinking modes and tool use with JSON mode. **GPT-OSS** models support reasoning capabilities. Reasoning tokens are included in output token counts and billed at output rates. No explicit reasoning effort parameter — thinking is model-dependent and automatic on supported models. [Groq Docs](https://console.groq.com/docs)

### JSON Mode
Yes. **Qwen3.6-27B** supports JSON mode via `response_format` parameter (OpenAI-compatible). The model can return structured JSON output when `response_format: { type: "json_object" }` is set. Also supports tool use with JSON mode simultaneously. [Groq Vision](https://console.groq.com/docs/vision)

### Tool Calling
Yes. **GPT-OSS** models and **Qwen3.6-27B** support function calling via the standard `tools` parameter (OpenAI-compatible). Parallel tool calls supported. `tool_choice: "auto"` (default) or specific function. Streaming tool calls supported. [Groq Docs](https://console.groq.com/docs)

### Context Window
**128K–131K tokens** across most models. Llama 3.1 8B Instant, GPT-OSS 20B/120B, Llama 3.3 70B, Qwen3 32B all have 128K–131K context windows. Kimi K2 has a longer context. [Groq Models](https://console.groq.com/docs/models)

### Free Tier / Free API Credits
Yes. **No credit card required**. Free tier includes:
- 30 RPM, 6,000–30,000 TPM (model-dependent), 1,000–14,400 RPD
- Access to all supported models (Llama 3.1 8B, Llama 3.3 70B, GPT-OSS 20B/120B, Qwen3 32B, Kimi K2, etc.)
- Whisper speech-to-text: 2,000 audio requests/day
- No free API credits — usage is metered by token consumption, but free tier has generous limits. [Groq Free Tier](https://klymentiev.com/blog/groq-pricing)

### Best Models (Top 3)
1. **GPT-OSS 20B** — Fastest and one of the cheapest at $0.075/$0.30 per 1M; 1,000 TPS; good for high-volume writing tasks.
2. **Llama 3.1 8B Instant** — Ultra-cheap at $0.05/$0.08 per 1M; 840 TPS; ideal for fast, lightweight writing tasks.
3. **GPT-OSS 120B** — More capable reasoning at $0.15/$0.60 per 1M; 500 TPS; best for complex writing tasks on Groq.

### Recommended Use Case for ToneCraft
Groq is ideal for **high-speed, low-cost writing tasks** — draft generation, tone analysis, readability scoring, and quick rewrites. GPT-OSS 20B is the best balance of speed and quality for routine writing. Llama 3.1 8B Instant for ultra-fast, low-complexity tasks. Groq's free tier (no credit card) makes it excellent for prototyping and development. Vision and reasoning are limited compared to OpenAI/Anthropic, so use Groq for tasks that don't require deep reasoning or image understanding.

---

## 6. Together AI

### Pricing (per 1M tokens)
| Model | Input | Output | Context |
|---|---|---|---|
| gpt-oss-120B | $0.15 | $0.60 | 128K |
| LFM2 24B A2B | $0.03 | $0.12 | — |
| Qwen3.5-397B-A17B | $0.60 | $3.60 | — |
| Kimi K2.5 | $0.50 | $2.80 | 262K |
| GLM-5.1 | $1.40 | $4.40 | — |
| Qwen3.6-Plus | $0.50 | $3.00 | — |
| DeepSeek V4 Pro | $2.10 | $4.40 (cached) | — |
| MiniMax M2.7 | $0.30 | $1.20 | — |
| Qwen3.5-9B | $0.17 | $0.25 | — |

Batch API: 50% discount. Serverless inference is the default pricing model (pay-per-token, no provisioning). Dedicated endpoints billed hourly (H100: $3.99–$5.49/hr). Fine-tuning starts at $0.48/1M tokens. [Together AI Pricing](https://www.together.ai/pricing)

### Rate Limits
**Dynamic rate limits** — no fixed per-model limits published. Limits scale with sustained usage and are applied per model, per organization. Rate limits are reported in response headers (`x-ratelimit-reset`). Two error types:
- `429 Too Many Requests` — your usage exceeded the dynamic rate
- `503 Service Unavailable` — platform capacity issue (not your fault)

Free accounts face stricter throttling than paid accounts. Build Tier 2+ (available after $5 spend) unlocks premium models and higher limits. For predictable capacity, use **dedicated endpoints** or **provisioned throughput** (PTUs). [Together AI Rate Limits](https://docs.together.ai/docs/serverless/rate-limits)

### Streaming Support
Yes. Together AI supports SSE streaming via the OpenAI-compatible `/chat/completions` endpoint with `stream=true`. Returns delta content events. SDKs (Together Python SDK, OpenAI-compatible SDKs) handle streaming natively. [Together AI Docs](https://docs.together.ai/docs/inference/pricing)

### Vision
Limited. Together AI's primary focus is text-based LLM inference. Some models support multimodal inputs, but vision capabilities are not as well-documented or as mature as OpenAI, Anthropic, or Google. Check individual model documentation for vision support. [Together AI Docs](https://docs.together.ai/docs/inference/pricing)

### Reasoning
Depends on the model. **DeepSeek V4 Pro** and **Qwen3.5-397B-A17B** support reasoning capabilities. Reasoning tokens are included in output token counts and billed at output rates. No explicit reasoning effort parameter — thinking is model-dependent. [Together AI Pricing](https://www.together.ai/pricing)

### JSON Mode
Depends on the model. Models that support the OpenAI-compatible API (most Together models) accept `response_format: { type: "json_object" }` for JSON mode. Structured output enforcement depends on the model's capabilities. [Together AI Docs](https://docs.together.ai/docs/inference/pricing)

### Tool Calling
Yes. Models that support the OpenAI-compatible API accept the `tools` parameter for function calling. Parallel tool calls supported where the underlying model allows it. `tool_choice: "auto"` (default) or specific function. [Together AI Docs](https://docs.together.ai/docs/inference/pricing)

### Context Window
Varies by model. Examples: gpt-oss-120B (128K), Kimi K2.5 (262K), Qwen3.5-397B-A17B (1M+). Check individual model documentation for context window details. [Together AI Models](https://www.together.ai/models)

### Free Tier / Free API Credits
**No free tier** as of July 2025. The earlier $25 signup credit was retired. Requires a **minimum $5 credit purchase** to access the platform. Prepaid credits do not expire. 68 models are available at no cost (including Llama 3.3 70B, Qwen 2.5 variants, Gemma models, Mistral Nemo) — but these still require the $5 minimum purchase to access. Startups can apply for the **Startup Accelerator** ($15K–$50K in additional credits). [Together AI Pricing](https://www.together.ai/pricing)

### Best Models (Top 3)
1. **gpt-oss-120B** — Best value at $0.15/$0.60 per 1M; strong general-purpose writing and reasoning.
2. **Qwen3.5-397B-A17B** — High-capability model at $0.60/$3.60 per 1M; excellent for complex writing tasks.
3. **Kimi K2.5** — Strong multilingual and reasoning at $0.50/$2.80 per 1M; good for diverse writing styles.

### Recommended Use Case for ToneCraft
Together AI is best for **budget-conscious, high-volume writing tasks** — draft generation, tone analysis, and routine content creation. gpt-oss-120B offers the best price-to-quality ratio for writing assistance. Together AI's dynamic rate limits make it less suitable for predictable, high-throughput production workloads unless you use dedicated endpoints or provisioned throughput. Use Together AI as a cost-effective secondary provider alongside OpenAI or Anthropic for primary writing tasks.

---

> **Part 1 complete.** Covers providers 1–6 of 13. Part 2 will cover Fireworks, Mistral, DeepSeek, Cohere, Perplexity, Cerebras, and the provider strategy section.
