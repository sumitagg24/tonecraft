/**
 * Client-side Paddle.js integration for hosted checkout.
 *
 * Uses the official @paddle/paddle-js SDK with initializePaddle().
 * Checkout opens via transaction ID (server-created) — the server validates
 * the user's subscription status and sets the price, so the client can't
 * tamper with amounts.
 *
 * @see paddle-checkout-web skill for the full pattern.
 */

import { initializePaddle, type Paddle, type PaddleEventData } from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle> | null = null;

// Global event handler — set during initialization so checkout events
// (completed, error, payment-error) are handled even if openPaddleCheckout
// isn't the one that opened the checkout.
let globalEventHandler: ((event: PaddleEventData) => void) | null = null;

/**
 * Initialize Paddle.js using the official SDK. Singleton — only initializes
 * once per page load. Environment is auto-detected from the client token
 * prefix (test_ → sandbox, live_ → production).
 *
 * The optional `pwCustomer` parameter enables Paddle Retain (dunning /
 * payment recovery) by associating the session with the Paddle customer ID.
 */
export function loadPaddle(opts?: {
  pwCustomer?: { id: string };
  eventCallback?: (event: PaddleEventData) => void;
}): Promise<Paddle> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (paddlePromise) return paddlePromise;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    return Promise.reject(
      new Error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN"),
    );
  }

  // Environment follows the CLIENT TOKEN, not NODE_ENV: sandbox tokens
  // (test_…) only work against the sandbox environment, so a production
  // deploy with a test token must still use "sandbox".
  const environment = token.startsWith("test_") ? "sandbox" : "production";

  if (opts?.eventCallback) {
    globalEventHandler = opts.eventCallback;
  }

  paddlePromise = initializePaddle({
    token,
    environment: environment as "sandbox" | "production",
    ...(opts?.pwCustomer?.id
      ? { pwCustomer: { id: opts.pwCustomer.id } }
      : {}),
    eventCallback: (event) => {
      globalEventHandler?.(event);
    },
  }).then((p) => {
    if (!p) throw new Error("Paddle.Initialize returned null");
    paddleInstance = p;
    return p;
  });

  return paddlePromise;
}

/**
 * Open Paddle checkout for a transaction (server-created).
 * The server validates subscription status and sets the price.
 */
export async function openPaddleCheckout(
  transactionId: string,
  opts?: {
    onSuccess?: () => void;
    onError?: () => void;
    onPaymentError?: () => void;
    fallbackUrl?: string;
    pwCustomer?: { id: string };
  },
): Promise<void> {
  const paddle = await loadPaddle({
    pwCustomer: opts?.pwCustomer,
    eventCallback: (event) => {
      if (event.name === "checkout.completed") {
        opts?.onSuccess?.();
      } else if (event.name === "checkout.error") {
        opts?.onError?.();
        if (opts?.fallbackUrl) window.location.assign(opts.fallbackUrl);
      } else if (event.name === "checkout.payment.error" || event.name === "checkout.payment.failed") {
        opts?.onPaymentError?.();
      }
    },
  });

  paddle.Checkout.open({
    transactionId,
    settings: { displayMode: "overlay" },
  });
}

/**
 * Open Paddle checkout directly by price ID (no server transaction needed).
 * Uses one-page overlay checkout with customer email prefill.
 *
 * @see paddle-checkout-web skill — "Overlay checkout — the minimum viable integration"
 */
export async function openPaddleCheckoutByPrice(
  priceId: string,
  opts?: {
    onSuccess?: () => void;
    onError?: () => void;
    onPaymentError?: () => void;
    customerEmail?: string;
    pwCustomer?: { id: string };
  },
): Promise<void> {
  const paddle = await loadPaddle({
    pwCustomer: opts?.pwCustomer,
    eventCallback: (event) => {
      if (event.name === "checkout.completed") {
        opts?.onSuccess?.();
      } else if (event.name === "checkout.error") {
        opts?.onError?.();
      } else if (event.name === "checkout.payment.error" || event.name === "checkout.payment.failed") {
        opts?.onPaymentError?.();
      }
    },
  });

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      successUrl: "/welcome",
    },
    ...(opts?.customerEmail ? { customer: { email: opts.customerEmail } } : {}),
  });
}
