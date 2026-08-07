/**
 * Client-side Paddle.js integration for hosted checkout.
 *
 * Paddle v2 loads from their CDN, is initialized with the *public* client
 * token (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN), and can open a checkout overlay
 * for an API-created transaction via Paddle.Checkout.open({ transactionId }).
 * This avoids redirecting users to the raw checkout URL (which is built from
 * the account's "default payment link" and may be a bare host).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Paddle?: any;
  }
}

let paddlePromise: Promise<any> | null = null;

export function loadPaddle(): Promise<any> {
  if (!paddlePromise) {
    paddlePromise = new Promise<any>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Paddle.js is client-only"));
        return;
      }
      if (window.Paddle) {
        resolve(window.Paddle);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.async = true;
      script.onload = () => resolve(window.Paddle);
      script.onerror = () => {
        paddlePromise = null; // allow retry on next call
        reject(new Error("Failed to load Paddle.js"));
      };
      document.head.appendChild(script);
    }).then(async (Paddle) => {
      try {
        Paddle.Environment.set(process.env.NODE_ENV === "production" ? "production" : "sandbox");
      } catch {
        // environment already set — fine
      }
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      if (token) {
        // Paddle.Initialize() returns a Promise — Checkout.open() must wait
        // for it or the overlay may never render (observed on first load).
        try {
          await Paddle.Initialize({ token });
        } catch {
          // already initialized or init failed — Checkout.open will surface it.
        }
      }
      return Paddle;
    });
  }
  return paddlePromise;
}

/**
 * Open Paddle's hosted checkout overlay for a transaction. Falls back by
 * rejecting so callers can navigate to the raw checkout URL instead.
 */
export async function openPaddleCheckout(
  transactionId: string,
  opts?: { onSuccess?: () => void; onError?: () => void }
): Promise<void> {
  const Paddle = await loadPaddle();
  Paddle.Checkout.open({
    transactionId,
    settings: { displayMode: "overlay", allowCurrencyChange: false },
    eventCallback: (event: any) => {
      if (event?.name === "checkout-completed") {
        opts?.onSuccess?.();
      }
    },
  });
}
