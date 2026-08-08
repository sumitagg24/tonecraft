import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation (App Router).
 *
 * `register` runs once per server instance at boot — it loads the Sentry
 * runtime config (Node vs Edge). `onRequestError` (Next 15+/16) is the
 * server-side error hook: it fires for uncaught exceptions in route handlers,
 * server components, and server functions, with request + routing context.
 *
 * Events are captured by the real `@sentry/nextjs` SDK (see
 * `sentry.server.config.ts` / `sentry.edge.config.ts`). The hook is exported
 * directly so reports are not lost when a serverless function exits right
 * after the error.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Automatically captures all unhandled server-side request errors with
// request + routing context. Requires @sentry/nextjs >= 8.28.0.
//
// Before delegating, we try to attribute the event to the signed-in Clerk
// user via the `x-clerk-auth-user-id` request header (set by clerkMiddleware
// on some setups). The read is defensive — it tolerates both a Headers
// instance and a plain record, and is a no-op when the header is absent.
export const onRequestError = (
  error: unknown,
  request: Parameters<typeof Sentry.captureRequestError>[1],
  errorContext: Parameters<typeof Sentry.captureRequestError>[2],
): void => {
  const headers = request?.headers;
  if (headers) {
    const headersInstance = headers as unknown as { get?: (key: string) => string | null };
    const record = headers as unknown as Record<string, string | string[] | undefined>;
    const clerkUserId =
      typeof headersInstance.get === "function"
        ? headersInstance.get("x-clerk-auth-user-id")
        : record["x-clerk-auth-user-id"];
    if (typeof clerkUserId === "string" && clerkUserId.length > 0) {
      Sentry.getCurrentScope().setUser({ id: clerkUserId });
    }
  }
  Sentry.captureRequestError(error, request, errorContext);
};
