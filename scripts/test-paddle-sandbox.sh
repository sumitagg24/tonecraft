#!/bin/bash
# =============================================================================
# Paddle Sandbox End-to-End Test Script
# =============================================================================
# Tests the full Paddle integration against the sandbox environment.
# Run from the project root: bash scripts/test-paddle-sandbox.sh
#
# Prerequisites:
# - Dev server running on localhost:3000
# - .env.local configured with sandbox credentials
# - Authenticated user session (for authenticated endpoints)
# =============================================================================

set -euo pipefail

SANDBOX_API="https://sandbox-api.paddle.com"
SANDBOX_KEY="${PADDLE_API_KEY:?Set PADDLE_API_KEY in .env.local first}"
LOCALHOST="http://localhost:3000"

echo "============================================"
echo "  Paddle Sandbox Integration Tests"
echo "============================================"
echo ""

# ─── 1. Sandbox API Connectivity ────────────────────────────────────────────
echo "1. Testing sandbox API connectivity..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SANDBOX_KEY" \
  "$SANDBOX_API/products?limit=2")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Sandbox API reachable (HTTP $HTTP_CODE)"
else
  echo "   ❌ Sandbox API failed (HTTP $HTTP_CODE)"
  exit 1
fi

# ─── 2. Sandbox Products Exist ──────────────────────────────────────────────
echo ""
echo "2. Verifying sandbox products..."
PRODUCTS=$(curl -s \
  -H "Authorization: Bearer $SANDBOX_KEY" \
  "$SANDBOX_API/products?limit=10")
PROD_COUNT=$(echo "$PRODUCTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
if [ "$PROD_COUNT" -ge 2 ]; then
  echo "   ✅ Found $PROD_COUNT products in sandbox"
else
  echo "   ❌ Expected at least 2 products, found $PROD_COUNT"
  exit 1
fi

# ─── 3. Sandbox Prices Exist ────────────────────────────────────────────────
echo ""
echo "3. Verifying sandbox prices..."
PRICES=$(curl -s \
  -H "Authorization: Bearer $SANDBOX_KEY" \
  "$SANDBOX_API/prices?limit=10")
PRICE_COUNT=$(echo "$PRICES" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
if [ "$PRICE_COUNT" -ge 4 ]; then
  echo "   ✅ Found $PRICE_COUNT prices in sandbox"
else
  echo "   ❌ Expected at least 4 prices, found $PRICE_COUNT"
  exit 1
fi

# ─── 4. Sandbox Client Token ────────────────────────────────────────────────
echo ""
echo "4. Verifying sandbox client token..."
TOKENS=$(curl -s \
  -H "Authorization: Bearer $SANDBOX_KEY" \
  "$SANDBOX_API/client-tokens?limit=5")
TOKEN_COUNT=$(echo "$TOKENS" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
if [ "$TOKEN_COUNT" -ge 1 ]; then
  echo "   ✅ Found $TOKEN_COUNT client token(s) in sandbox"
else
  echo "   ❌ No client tokens found in sandbox"
  exit 1
fi

# ─── 5. Sandbox Notification Destinations ────────────────────────────────────
echo ""
echo "5. Verifying sandbox notification destinations..."
DESTS=$(curl -s \
  -H "Authorization: Bearer $SANDBOX_KEY" \
  "$SANDBOX_API/notifications?limit=10")
DEST_COUNT=$(echo "$DESTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
if [ "$DEST_COUNT" -ge 1 ]; then
  echo "   ✅ Found $DEST_COUNT notification destination(s) in sandbox"
else
  echo "   ⚠️  No notification destinations found — webhooks won't work"
fi

# ─── 6. Local Server Health ─────────────────────────────────────────────────
echo ""
echo "6. Testing local server health..."
HEALTH=$(curl -s -w "\n%{http_code}" "$LOCALHOST/api/health" 2>/dev/null)
HEALTH_CODE=$(echo "$HEALTH" | tail -1)
if [ "$HEALTH_CODE" = "200" ]; then
  echo "   ✅ Local server healthy (HTTP $HEALTH_CODE)"
else
  echo "   ⚠️  Local server returned HTTP $HEALTH_CODE (may need dev server running)"
fi

# ─── 7. Billing Health Endpoint ──────────────────────────────────────────────
echo ""
echo "7. Testing billing health endpoint..."
BILLING_HEALTH=$(curl -s -w "\n%{http_code}" "$LOCALHOST/api/billing/health" 2>/dev/null)
BILLING_CODE=$(echo "$BILLING_HEALTH" | tail -1)
BILLING_BODY=$(echo "$BILLING_HEALTH" | head -1)
if [ "$BILLING_CODE" = "200" ] || [ "$BILLING_CODE" = "401" ]; then
  echo "   ✅ Billing health endpoint responding (HTTP $BILLING_CODE)"
  if [ "$BILLING_CODE" = "200" ]; then
    echo "   ℹ️  Response: $(echo "$BILLING_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'overall={d.get(\"overall\",\"?\")}, environment={d.get(\"environment\",\"?\")}')" 2>/dev/null || echo 'parsed')"
  fi
else
  echo "   ⚠️  Billing health returned HTTP $BILLING_CODE"
fi

# ─── 8. Webhook Endpoint (POST without signature — should return 401) ───────
echo ""
echo "8. Testing webhook endpoint (expect 401 without valid signature)..."
WEBHOOK=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  "$LOCALHOST/api/billing/webhook" 2>/dev/null)
WEBHOOK_CODE=$(echo "$WEBHOOK" | tail -1)
if [ "$WEBHOOK_CODE" = "401" ] || [ "$WEBHOOK_CODE" = "403" ]; then
  echo "   ✅ Webhook endpoint correctly rejects unsigned requests (HTTP $WEBHOOK_CODE)"
else
  echo "   ⚠️  Webhook returned HTTP $WEBHOOK_CODE (expected 401/403)"
fi

# ─── 9. Portal Endpoint (should return 401 without auth) ───────────────────
echo ""
echo "9. Testing portal endpoint (expect 401 without auth)..."
PORTAL=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  "$LOCALHOST/api/billing/portal" 2>/dev/null)
PORTAL_CODE=$(echo "$PORTAL" | tail -1)
if [ "$PORTAL_CODE" = "401" ] || [ "$PORTAL_CODE" = "307" ]; then
  echo "   ✅ Portal endpoint correctly requires auth (HTTP $PORTAL_CODE)"
else
  echo "   ⚠️  Portal returned HTTP $PORTAL_CODE (expected 401/307)"
fi

# ─── 10. Checkout Endpoint (should return 401 without auth) ─────────────────
echo ""
echo "10. Testing checkout endpoint (expect 401 without auth)..."
CHECKOUT=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"plan":"Pro","interval":"month"}' \
  "$LOCALHOST/api/billing/checkout" 2>/dev/null)
CHECKOUT_CODE=$(echo "$CHECKOUT" | tail -1)
if [ "$CHECKOUT_CODE" = "401" ] || [ "$CHECKOUT_CODE" = "307" ]; then
  echo "   ✅ Checkout endpoint correctly requires auth (HTTP $CHECKOUT_CODE)"
else
  echo "   ⚠️  Checkout returned HTTP $CHECKOUT_CODE (expected 401/307)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Test Summary"
echo "============================================"
echo ""
echo "Sandbox Test Cards:"
echo "  ✅ Success:  4242 4242 4242 4242"
echo "  ✅ 3DS:      4000 0038 0000 0446"
echo "  ✅ Declined: 4000 0000 0000 0002"
echo "  ✅ Dunning:  4000 0027 6000 3184"
echo ""
echo "Manual Testing Steps:"
echo "  1. Open http://localhost:3000/pricing"
echo "  2. Click 'Upgrade to Pro'"
echo "  3. Complete checkout with test card 4242 4242 4242 4242"
echo "  4. Verify redirect to success page"
echo "  5. Check /api/billing/health shows 'ok'"
echo "  6. Check /api/billing/history shows the transaction"
echo "  7. Open Paddle sandbox dashboard to verify transaction"
echo ""
echo "Webhook Testing (with tunnel):"
echo "  1. Install hookdeck: brew install hookdeck/hookdeck/hookdeck"
echo "  2. Run: hookdeck listen 3000"
echo "  3. Update sandbox notification destination URL to tunnel URL"
echo "  4. Use Paddle dashboard simulator to fire events"
echo ""
echo "Done! ✅"
