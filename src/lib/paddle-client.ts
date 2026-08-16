/**
 * Client-side Paddle.js integration for hosted checkout.
 *
 * Paddle v2 loads from their CDN, is initialized with the *public* client
 * token (NEXT_PUBLIC_PADDLE_CLIENT_TOKEN), and can open a checkout overlay
 * for an API-created transaction via Paddle.Checkout.open({ transactionId }).
 * This avoids redirecting users to the raw checkout URL (which is built from
 * the account's "default payment link" and may be a bare host).
 */

interface PaddleEnvironment {
  set: (environment: "sandbox" | "production") => void;
}

interface PaddleCheckout {
  open: (options: PaddleCheckoutOptions) => void;
}

interface PaddleCheckoutOptions {
  transactionId: string;
  settings?: {
    displayMode: "overlay" | "inline";
    theme?: "light" | "dark";
    allowCurrencyChange?: boolean;
  };
  eventCallback?: (event: PaddleEvent) => void;
}

interface PaddleEvent {
  name: string;
  data?: Record<string, unknown>;
}

interface PaddleInstance {
  Environment: PaddleEnvironment;
  Checkout: PaddleCheckout;
  Initialize: (options: { token: string }) => Promise<void>;
}

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

let paddlePromise: Promise<PaddleInstance> | null = null;

export function loadPaddle(): Promise<PaddleInstance> {
  if (!paddlePromise) {
    paddlePromise = new Promise<PaddleInstance>((resolve, reject) => {
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
      script.onload = () => {
        if (window.Paddle) {
          resolve(window.Paddle);
        } else {
          paddlePromise = null; // allow retry on next call
          reject(new Error("Paddle.js loaded but window.Paddle is undefined"));
        }
      };
      script.onerror = () => {
        paddlePromise = null; // allow retry on next call
        reject(new Error("Failed to load Paddle.js"));
      };
      document.head.appendChild(script);
    }).then(async (Paddle) => {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      try {
        // Environment follows the CLIENT TOKEN, not NODE_ENV: sandbox tokens
        // (test_…) only work against the sandbox environment, so a production
        // deploy with a test token must still use "sandbox".
        Paddle.Environment.set(token?.startsWith("test_") ? "sandbox" : "production");
      } catch {
        // environment already set — fine
      }
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
 * Open Paddle's hosted checkout overlay for a transaction. If the overlay
 * fails to load, `fallbackUrl` (the transaction's hosted checkout URL) is
 * navigated to so the user still reaches a payment page instead of a dead
 * "contact support" overlay.
 */
export async function openPaddleCheckout(
  transactionId: string,
  opts?: { onSuccess?: () => void; onError?: () => void; fallbackUrl?: string }
): Promise<void> {
  const Paddle = await loadPaddle();
  Paddle.Checkout.open({
    transactionId,
    // NOTE: allowCurrencyChange must NOT be set — the checkout service returns
    // a 400 (validation.no_validation_set) unless the account has currency
    // change validation configured, which would blank the overlay.
    settings: { displayMode: "overlay" },
    eventCallback: (event: PaddleEvent) => {
      // Event names are dotted ("checkout.completed", "checkout.error") per
      // https://developer.paddle.com/paddle-js/events. A dashed name never
      // matches, so the success callback silently never fired.
      if (event?.name === "checkout.completed") {
        opts?.onSuccess?.();
      } else if (event?.name === "checkout.error") {
        // Overlay could not be opened (unapproved domain / missing default
        // payment link / env mismatch). Send the user to Paddle's hosted
        // checkout instead of leaving them on an error frame.
        opts?.onError?.();
        if (opts?.fallbackUrl) window.location.assign(opts.fallbackUrl);
      }
    },
  });
}
