# Comprehensive User Configuration Guide for ToneCraft

## 1. Environment Configuration

### 1.1 Create .env.local File
Create a file named `.env.local` in the root directory with the following structure:

```env
# ==========================================
# APP CONFIGURATION
# ==========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==========================================
# DATABASE CONFIGURATION (Neon PostgreSQL)
# ==========================================
DATABASE_URL="postgresql://<username>:<password>@<neondb-endpoint>/<database>?sslmode=require"

# ==========================================
# CLERK AUTHENTICATION
# ==========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
CLERK_WEBHOOK_SECRET="your-clerk-webhook-secret"

# ==========================================
# AI PROVIDER CONFIGURATION
# ==========================================
# Groq (Primary - fastest free tier)
GROQ_API_KEY="your-groq-api-key"

# OpenRouter (Fallback - multiple models)
OPENROUTER_API_KEY="your-openrouter-api-key"
# Base URL is fixed: https://openrouter.ai/api/v1

# Google AI (Secondary)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Optional Pro-tier fallback providers
OPENAI_API_KEY="your-openai-api-key"  # For Pro tier
ANTHROPIC_API_KEY="your-anthropic-api-key"  # For Pro tier

# ==========================================
# STRIPE PAYMENTS
# ==========================================
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRICE_ID_PRO="price_..."  # Replace with actual price ID
STRIPE_PRICE_ID_ENTERPRISE="price_..."  # Replace with actual price ID
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO="price_..."  # Replace with actual price ID
NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE="price_..."  # Replace with actual price ID

# ==========================================
# UPSTASH REDIS (Rate Limiting)
# ==========================================
UPSTASH_REDIS_REST_URL="https://<your-upstash-instance>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-secret-token"

# ==========================================
# CLOUDFLARE R2 (File Storage)
# ==========================================
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-cloudflare-access-key-id"
R2_SECRET_ACCESS_KEY="your-cloudflare-secret-access-key"
R2_BUCKET_NAME="tonecraft-uploads"
R2_PUBLIC_URL="https://<your-bucket>.r2.dev"

# ==========================================
# ADDITIONAL SETTINGS
# ==========================================
# For development, you can use localhost for R2 if needed
# R2_PUBLIC_URL="http://localhost:3000/uploads/<key>"