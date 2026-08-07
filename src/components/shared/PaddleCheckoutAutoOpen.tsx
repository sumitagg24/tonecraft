"use client";

import { useEffect } from "react";
import { openPaddleCheckout } from "@/lib/paddle-client";

/**
 * Auto-opens Paddle's hosted checkout overlay when the page URL carries a
 * Paddle transaction reference (`?_ptxn=txn_...`).
 *
 * Paddle builds hosted-checkout URLs as `<default payment link>?_ptxn=<txn>`,
 * so the page served at that link must load Paddle.js and open checkout for
 * the transaction. Mounting this in the root layout makes the configured
 * default payment link work end-to-end — whether it points at an ngrok
 * tunnel, the Vercel domain, or a custom domain.
 *
 * It renders nothing and loads Paddle.js only when `_ptxn` is present, so it
 * is zero-cost on ordinary page loads.
 */
export function PaddleCheckoutAutoOpen() {
  useEffect(() => {
    const txn = new URLSearchParams(window.location.search).get("_ptxn");
    if (!txn) return;

    openPaddleCheckout(txn).catch(() => {
      // Paddle.js unavailable (offline / CDN blocked) — nothing to render;
      // the billing page still handles checkout through its own flow.
    });
  }, []);

  return null;
}
