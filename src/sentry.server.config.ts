/**
 * Sentry init — Node.js server runtime.
 *
 * Loaded from `src/instrumentation.ts` when `NEXT_RUNTIME === "nodejs"`.
 * Baseline: error monitoring + tracing. Add more signals (logging, profiling,
 * AI monitoring, …) only when explicitly requested.
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    // 100% in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    // Attach local variable values to stack frames for easier debugging
    includeLocalVariables: true,
    // Toggle verbose SDK logging (envelope send confirmation) via SENTRY_DEBUG=true
    debug: process.env.SENTRY_DEBUG === "true",
  });
}
