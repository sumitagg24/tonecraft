# Production Cutover Guide

Move ToneCraft from development/sandbox to production across **Clerk**, **Paddle**,
**Vercel**, **Cloudflare R2**, and the **LLM providers**.

> **Ground rule:** every key below has a dev/sandbox twin and a production twin.
> Sandbox keys (`pk_test_`, `sk_test_`, `pdl_sdbx_`, `test_…`) **only** work in
> sandbox; live keys (`pk_live_`, `sk_live_`, `pdl_live_`) **only** work in live.
> Mixing them causes "contact support" checkout failures, dev-mode badges, and
> 401s. The app code auto-detects environment from the key prefix, so there is
> **no code change needed** — only the values must be swapped.

---

## Current state (audit, Aug 10 2026)

| Service | Variable | Current | Needed |
|---|---|---|---|
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` |
| Clerk | `CLERK_SECRET_KEY` | `sk_test_…` | `sk_live_…` |
| Clerk | `CLERK_WEBHOOK_SECRET` | dev/placeholder | `whsec_…` from PROD webhook |
| Paddle | `PADDLE_API_KEY` | `pdl_sdbx_…` | `pdl_live_…` |
| Paddle | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` / `PADDLE_CLIENT_TOKEN` | `test_…` | live token (no `test_`) |
| Paddle | `PADDLE_WEBHOOK_SECRET` | sandbox `pdl_ntfset_…` | live `pdl_ntfset_…` |
| Paddle | `PADDLE_PRICE_*` (4) | sandbox `pri_…` | **live** `pri_…` |
| App | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://tonecraft-psi.vercel.app` |
| R2 | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `...` placeholders | real Cloudflare creds |
| LLM | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | placeholders | real keys (or delete — GROQ/OpenRouter/Google already set) |

Everything else (`DATABASE_URL`, `DIRECT_URL`, Upstash, `CRON_SECRET`, Sentry,
`R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`GOOGLE_AI_API_KEY`) is already set.

---

## Step 1 — Clerk (dashboard.clerk.com)

1. Open **Clerk Dashboard** → your **PRODUCTION instance** (if you don't have one:
   create it under **Organization/Instance settings → Create instance**; you can
   copy users from the dev instance via **Transfer instance**).
2. **API Keys** tab → copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_…`
   - **Secret key** → `CLERK_SECRET_KEY` = `sk_live_…`
3. **Webhooks** tab → **Add Endpoint**:
   - URL: `https://tonecraft-psi.vercel.app/api/webhook/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing secret** → `CLERK_WEBHOOK_SECRET` = `whsec_…`
   - Hit **Send test** for `user.created` after deploying; the route replies `{"received":true}`.
4. **Production limits**: go to **Instance → Settings → Production Limits** and
   mark the instance as production (removes the dev-mode banner and 100-user cap).
   This is the step that removes **"Development mode"** from `/sign-up`.

## Step 2 — Paddle (vendor.paddle.com)

1. **Developer Tools → Authentication** → generate a **LIVE API key**
   → `PADDLE_API_KEY` = `pdl_live_…`.
2. **Developer Tools → Notifications** (or **Webhooks**):
   - URL: `https://tonecraft-psi.vercel.app/api/billing/webhook`
   - Events: `transaction.completed`, `transaction.payment_succeeded`,
     `subscription.created`, `subscription.updated`, `subscription.canceled`,
     `subscription.past_due` (existing set is fine).
   - Copy the **secret key** → `PADDLE_WEBHOOK_SECRET` = `pdl_ntfset_…`.
3. **Developer Tools → Paddle.js** → copy the **client-side token** (live token
   does **not** start with `test_`) → both `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` and
   `PADDLE_CLIENT_TOKEN`. Also add your production domain under **Allowed domains**.
4. **Create live prices** (Catalog → Products):
   - Products: `Pro`, `Enterprise` (create in live if missing).
   - Prices (USD):
     - Pro monthly `$6.00` → `PADDLE_PRICE_PRO`
     - Pro annual `$57.60` → `PADDLE_PRICE_PRO_ANNUAL`
     - Enterprise monthly `$15.00` → `PADDLE_PRICE_ENTERPRISE`
     - Enterprise annual `$144.00` → `PADDLE_PRICE_ENTERPRISE_ANNUAL`
   - **Script:** once `PADDLE_API_KEY=pdl_live_…` is available, run
     `PADDLE_API_KEY=pdl_live_… node scripts/paddle-create-annual.js` to create
     the two annual prices automatically (script now follows the key prefix:
     sandbox key → sandbox, live key → live).
5. **Checkout → Default payment link** → point at `https://tonecraft-psi.vercel.app`.

## Step 3 — Cloudflare R2

1. cloudflare.com → **R2 → Overview** → copy **Account ID** → `R2_ACCOUNT_ID`.
2. **Manage R2 API Tokens** → create a token with **Object Read & Write** on the
   `tonecraft-uploads` bucket → copy **Access Key ID** → `R2_ACCESS_KEY_ID` and
   **Secret Access Key** → `R2_SECRET_ACCESS_KEY`.
3. Confirm `R2_BUCKET_NAME` (`tonecraft-uploads`) and `R2_PUBLIC_URL`
   (`https://pub-….r2.dev`) match the bucket.

## Step 4 — Vercel (vercel.com/dashboard → tonecraft-psi project)

> ⚠️ You have **two** Vercel projects (`tonecraft` and `tonecraft-psi`). The one
> actually serving users is **tonecraft-psi** — update **that** project.

1. **Settings → Environment Variables** → for the **Production** environment,
   set every variable from Steps 1–3 plus:
   - `NEXT_PUBLIC_APP_URL` = `https://tonecraft-psi.vercel.app`
   - `DATABASE_URL` / `DIRECT_URL` (Neon production DB, pooled + direct)
   - Keep Upstash, Sentry, `CRON_SECRET`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`,
     and at least one LLM key (`GROQ_API_KEY` / `OPENROUTER_API_KEY` /
     `GOOGLE_AI_API_KEY`) — all already present.
   - `NEXT_PUBLIC_CLERK_*` URL/redirect vars are already set (`/sign-in`,
     `/sign-up`, `/chat`) — no change needed.
2. **Settings → Deployment Protection** → turn **OFF** "Vercel Authentication"
   for Production so real users are not logged out by a login wall.
3. **Settings → Domains** → confirm the production domain points at
   **tonecraft-psi.vercel.app** (or the custom domain), not the stale
   `tonecraft.vercel.app` template.
4. **Deploy:** push a commit (or Redeploy from the dashboard). The rebuild inlines
   the new `NEXT_PUBLIC_*` values (Clerk publishable key + Paddle client token
   are baked at build time — a redeploy is **required** for the dev-mode badge
   to disappear).

## Step 5 — Verify

Run the verifier from the project root (values from `.env.local`):

```bash
node scripts/production-cutover.js
# once a live Paddle key is configured:
PADDLE_API_KEY=pdl_live_… node scripts/production-cutover.js --verify-paddle
```

Expected: all `✅`, live prices `FOUND … [active]`. Then on the live site:
- `/sign-up` shows **no** "Development mode" badge.
- `/billing?plan=pro` opens the Paddle checkout with **no** "Test Mode" badge
  and a **live** (non-`test_`) token.
- `POST /api/billing/webhook` and `/api/webhook/clerk` return `{"received":true}`
  from their dashboards' "Send test" buttons.

---

## Notes

- **Do not** put live keys in `.env.local` unless you want local dev to hit
  production services (real charges!). Vercel Production env is the source of
  truth for the deployed app.
- The code already derives the Paddle environment from the key prefix
  (`pdl_sdbx_` → sandbox, else live) in `PaddleProvider.ts`,
  `paddle-client.ts`, and `ProviderHealthService.ts` — no source changes needed.
- Optional placeholders (`OPENAI_API_KEY=your-openai-key`, `ANTHROPIC_API_KEY`)
  can be deleted if not used; GROQ/OpenRouter/Google keys are already live.
