# Monetization Research

## Overview
Analysis of SaaS pricing for AI writing assistants and recommended pricing model for ToneCraft.

## Competitor Pricing Analysis

| Product | Free Tier | Pro / Individual | Team / Business | Enterprise | Credit System | Feature Gating |
|---------|-----------|------------------|-----------------|------------|---------------|----------------|
| **Jasper** | 7-day trial | $49/mo (Creator) | $125/mo (Teams) | Custom | Word credits | Templates, Brand Voice, SEO |
| **Copy.ai** | 2,000 words/mo | $49/mo (Pro) | $249/mo (Team) | Custom | Unlimited words | Workflows, Brand Voice |
| **Grammarly** | Basic free | $12/mo (Premium) | $15/mo/user (Business) | Custom | Unlimited | Tone, Clarity, Plagiarism |
| **Rytr** | 10k chars/mo | $9/mo (Saver) | $29/mo (Unlimited) | Custom | Character credits | Use cases, Languages |
| **Writesonic** | 10k words/mo | $16/mo (Short) | $12.67/mo (Long) | Custom | Word credits | Templates, Quality levels |
| **Notion AI** | 20 AI responses | $8/mo (Plus) | $10/mo/user (Business) | Custom | Unlimited | AI blocks, Q&A |
| **ChatGPT Plus** | Free (GPT-3.5) | $20/mo (Plus) | $25/mo/user (Team) | Custom | Unlimited | GPT-4, Plugins, DALL·E |
| **Claude Pro** | Free (Sonnet) | $20/mo (Pro) | $30/mo/user (Team) | Custom | Unlimited | Opus, Projects, API |
| **Perplexity** | Free (limited) | $20/mo (Pro) | $40/mo/user (Team) | Custom | Unlimited | Copilot, File upload |

## Recommended ToneCraft Pricing Tiers

### Free Plan
- **Price**: $0
- **Limits**: 100,000 words/month (≈5,000 prompts)
- **Features**:
  - Basic AI writing (draft generation, auto-correction)
  - Single AI provider (GPT-5.4 Mini for cost efficiency)
  - 1 export format per document
  - No brand tone customization
  - No API access
- **Hard Caps**: 500 words per request, 10 requests/minute

### Pro Plan
- **Price**: $19/month ($171/year with 20% annual discount)
- **Limits**: 1,000,000 words/month (≈10,000 words/day)
- **Features**:
  - Unlimited AI providers (GPT-5.5, Claude Sonnet 4.6, Gemini Pro)
  - Brand tone trainer & style guide integration
  - API access with $50/month token credit
  - Multiple export formats (PDF, Markdown, HTML)
  - Priority support
  - Advanced templates library
- **Feature Gates**: API access, brand tone editor, advanced templates

### Business Plan
- **Price**: $99/month/user ($891/year/user with 25% annual discount)
- **Limits**: 5,000,000 words/month per user
- **Features**:
  - Dedicated API credits (1M tokens/month)
  - Team workspaces & role-based access (Admin, Editor, Viewer)
  - Brand voice repository (50+ tone profiles)
  - Usage analytics & ROI calculator
  - Custom integrations (CRM, CMS, Slack)
  - GDPR/ISO compliance
  - SSO (SAML/OIDC)
- **Feature Gates**: Team workspaces, SSO, analytics, custom integrations

### Enterprise Plan
- **Price**: Custom (starting $500/month)
- **Limits**: Tailored (e.g., 50M tokens/month)
- **Features**:
  - Custom AI provider quotas
  - HIPAA/SOC 2 compliance
  - Dedicated solutions engineer
  - White-label UI/UX
  - On-premise deployment option
  - SLA with 99.9% uptime
  - Custom model fine-tuning
- **Feature Gates**: All features unlocked, custom SLA, on-premise

## Credit System Design
- **Token-based billing**: $0.0015/1K tokens (GPT-5.5), $0.0005/1K tokens (GPT-5.4 Mini)
- **Monthly allowance**: Included in tier; overage charged at tier rate
- **Bulk discounts**: 10% off at 10M tokens, 20% off at 100M tokens
- **Credit rollover**: Unused credits roll over 1 month (Pro+)
- **Usage dashboard**: Real-time token consumption, cost estimates

## Feature Gating Strategy

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|------------|
| Core writing assistant | ✅ | ✅ | ✅ | ✅ |
| Multi-provider access | ❌ | ✅ | ✅ | ✅ |
| Brand tone editor | ❌ | ✅ | ✅ | ✅ |
| API access | ❌ | ✅ (limited) | ✅ (full) | ✅ (custom) |
| Team workspaces | ❌ | ❌ | ✅ | ✅ |
| SSO/SCIM | ❌ | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ | ✅ |
| Custom integrations | ❌ | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |
| On-premise | ❌ | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | 99.5% | 99.9% |

## Monthly & Daily Limits

| Tier | Monthly Words | Daily Words | Requests/Min | API Tokens/Month |
|------|---------------|-------------|--------------|------------------|
| Free | 100,000 | 3,333 | 10 | 0 |
| Pro | 1,000,000 | 10,000 | 60 | 500,000 |
| Business | 5,000,000 | 166,666 | 120 | 1,000,000 |
| Enterprise | Custom | Custom | Custom | Custom |

## Best Monetization Model: Tiered + Usage-Based Hybrid

### Why This Model
1. **Low barrier to entry** (Free tier drives acquisition)
2. **Predictable revenue** (Tiered subscriptions)
3. **Upsell path** (Usage overages → higher tiers)
4. **Enterprise flexibility** (Custom contracts)
5. **Cost alignment** (Token-based API pricing matches provider costs)

### Revenue Projections (Conservative)
- **Year 1**: 10,000 Free → 500 Pro → 50 Business → 5 Enterprise
  - MRR: $9,500 + $4,950 + $2,500 = ~$17K/mo
- **Year 3**: 100,000 Free → 5,000 Pro → 500 Business → 20 Enterprise
  - MRR: $95K + $49.5K + $10K = ~$155K/mo

## Implementation Considerations

### Billing Infrastructure
- **Provider**: Stripe (primary) + Paddle (EU fallback)
- **Metered billing**: Stripe Metered Billing for token usage
- **Webhooks**: Handle subscription events, usage alerts, grace periods

### Feature Flags
- Use LaunchDarkly or custom feature flag service
- Gate features per tier at API and UI level
- Audit logs for compliance

### Grace Periods & Retention
- 7-day grace on failed payments
- Downgrade path preserves data
- Export all data on cancellation

## Security & Compliance
- **PCI DSS**: Handled by Stripe/Paddle
- **GDPR**: Data export/deletion APIs, EU data residency option
- **SOC 2**: Target Type II by Year 2
- **HIPAA**: Enterprise only, requires BAA

## Sources / References
- Jasper pricing: https://www.jasper.ai/pricing
- Copy.ai pricing: https://www.copy.ai/pricing
- Grammarly pricing: https://www.grammarly.com/premium
- Rytr pricing: https://rytr.me/pricing
- Writesonic pricing: https://writesonic.com/pricing
- Notion AI pricing: https://www.notion.so/pricing
- ChatGPT Plus: https://openai.com/blog/chatgpt-plus
- Claude Pro: https://claude.ai/pricing
- Perplexity Pro: https://www.perplexity.ai/pricing