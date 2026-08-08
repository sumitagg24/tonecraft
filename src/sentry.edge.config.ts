/**
 * Sentry init — Edge runtime.
 *
 * Loaded from `src/instrumentation.ts` when `NEXT_RUNTIME === "edge"`.
 * Baseline: error monitoring + tracing.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    // Toggle verbose SDK logging via SENTRY_DEBUG=true
    debug: process.env.SENTRY_DEBUG === "true",
  });
}
