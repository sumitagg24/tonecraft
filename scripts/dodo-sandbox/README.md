# Dodo Sandbox End-to-End Checkout Verification

Proves the **full paid flow works without real money** and without touching the
live merchant: plan → checkout session → sandbox payment with a test card →
webhook → entitlement sync in the database.

Uses the **Dodo sandbox (test_mode)** merchant only. The production keys on
Vercel stay untouched, so real customers keep paying normally on
`www.tonecraft.site`.

> Run with real card? No. Sandbox test cards only — see Dodo's
> [testing docs](https://docs.dodopayments.com/miscellaneous/testing-process).

## What it verifies

1. `POST /api/billing/checkout` resolves `plan` → the right `DODO_PRODUCT_*`
   id and returns a real Dodo checkout URL (session creation).
2. The resolved product id actually exists in the **sandbox catalog** (guards
   against accidentally pointing at live product ids).
3. Paying `4242 4242 4242 4242` (exp `06/32`, cvv `123`) succeeds — no charge.
4. The webhook leg syncs the subscription so `GET /api/billing/customer`
   reports `active`.

## Prerequisites

- Dodo dashboard → switch the top toggle to **Sandbox / Test mode**.
- The sandbox merchant needs the **same three products** as live
  (Basic / Pro / Advanced). Create them in the dashboard under Products if the
  sandbox catalog is empty, then copy their `pdt_…` ids.
- A Clerk session or credentials for the test account that will "pay"
  (see Auth below).
- Node + the repo deps installed (Playwright chromium:
  `npm run test:e2e:install`).

## Setup

### 1. Sandbox env file

Copy the example and fill it in — **sandbox** values only:

```bash
cp scripts/dodo-sandbox/env.sandbox.example .env.sandbox
# edit .env.sandbox:
#   DODO_PAYMENTS_API_KEY=…        (sandbox API key from the dashboard)
#   DODO_PAYMENTS_WEBHOOK_KEY=…    (sandbox webhook signing key)
#   DODO_PRODUCT_BASIC=…           (sandbox pdt_ ids)
#   DODO_PRODUCT_PRO=…
#   DODO_PRODUCT_ADVANCED=…
#   DODO_PAYMENTS_ENVIRONMENT=test_mode
#   DODO_PAYMENTS_RETURN_URL=http://127.0.0.1:3100/welcome
```

`.env.sandbox` is gitignored — sandbox keys never touch `.env.local`.

### 2. Start the local server wired to sandbox

Exported vars win over `.env.local`, so the app boots in test mode:

```bash
set -a && source .env.sandbox && set +a
npm run dev -- -p 3100
```

Sanity-check the boot log shows `Dodo Payments provider initialized
{ environment: 'test_mode' }`.

### 3. Point sandbox webhooks at this machine

Dodo fires real webhook events for sandbox transactions. Either:

**a) Dodo CLI (recommended, no public URL):**
```bash
npm i -g @dodopayments/cli        # one-time
dodo wh listen --port 3100
```
then set the sandbox merchant's webhook endpoint in the dashboard to whatever
URL the CLI prints.

**b) Quick tunnel fallback:**
```bash
npx --yes localtunnel --port 3100
```
then set the sandbox webhook endpoint to `https://<tunnel>.loca.lt/api/webhooks/dodo`
(with the signing key from step 1). Verify reachability first:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<tunnel>.loca.lt/api/webhooks/dodo
# expect 401 (route reached, signature rejected) — not 404/502
```

## Run

```bash
# recommended: pre-saved Clerk session
E2E_STORAGE_STATE=./.auth/state.json \
  node scripts/dodo-sandbox/checkout-sandbox.cjs --plan pro --interval month

# or interactive login with the test account
E2E_EMAIL=you@example.com E2E_PASSWORD=… \
  node scripts/dodo-sandbox/checkout-sandbox.cjs --plan pro --interval month

# add --headed to watch the payment page
```

Pass `--plan basic|advanced` and `--interval year|month` to sweep the other
tiers. The account must not already have an active subscription (the API
returns 409) — cancel from the billing page or use a fresh account.

Expected output:

```
[1/4] Creating monthly 'pro' checkout session…
→ Session created OK (HTTP 200)
→ checkout_url: https://checkout.sandbox.dodopayments.com/…
[2/4] Cross-checking the resolved product against the sandbox catalog…
→ Product id resolves in the sandbox catalog. ✓
[3/4] Opening Dodo sandbox checkout and paying with the test card…
→ Payment accepted — redirected to …
[4/4] Verifying post-payment entitlement…
→ Subscription synced: active (plan: pro) ✓

✅ Sandbox checkout E2E passed: session → payment → webhook → entitlement.
```

## Cleanup

- Delete the test subscription from the Dodo **sandbox** dashboard, and
  downgrade/remove the test account's subscription in the ToneCraft DB
  (`node scripts/dodo-sandbox/…` has no side effects beyond what a real user
  does — the webhook wrote one subscription row for the test account).
- Remove `.env.sandbox` when done.
