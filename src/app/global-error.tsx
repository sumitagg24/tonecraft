"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Root error boundary (App Router). Catches errors in the root layout that
 * route-level `error.tsx` boundaries can't — this file must render its own
 * <html>/<body> since the root layout has already failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#faf9f7", color: "#1c1a17" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a857c", margin: 0 }}>
            ToneCraft
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: 15, color: "#5c574e", maxWidth: 420, margin: 0 }}>
            An unexpected error occurred. The issue has been reported — try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: "10px 22px",
              borderRadius: 10,
              border: "1px solid #d9d4cb",
              background: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
