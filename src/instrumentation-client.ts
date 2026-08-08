/**
 * Sentry init — browser / client runtime.
 *
 * Auto-loaded by Next.js (`instrumentation-client.ts` convention, App Router).
 * Runs before the app becomes interactive, so early client errors are captured.
 *
 * Baseline: error monitoring + tracing (client navigation spans) + session
 * replay (10% of sessions, 100% when an error occurs).
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    // 100% in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    // Session Replay — record 10% of sessions; always capture a replay when an
    // error occurs (replaysOnErrorSampleRate wins over the session sample).
    // Default masking applies (maskAllText, blockAllMedia) for privacy.
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Toggle verbose SDK logging via SENTRY_DEBUG=true
    debug: process.env.SENTRY_DEBUG === "true",
  });
}

// Hook into App Router navigation transitions (tracing client-side navigations).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
