import type { Instrumentation } from "next";

/**
 * Next.js instrumentation (App Router).
 *
 * `register` runs once per server instance at boot — used for any one-time
 * monitor setup. `onRequestError` (Next 15+/16) is the server-side error hook:
 * it fires for uncaught exceptions in route handlers, server components, and
 * server functions, with request + routing context.
 *
 * Events are forwarded to the dependency-free Sentry envelope client in
 * `src/lib/error-reporting.ts` (see its header for the DSN swap point).
 * The hook is awaited so reports are not lost when a serverless function
 * exits right after the error.
 */

export function register() {
  // One-time bootstrap. The error reporter reads SENTRY_DSN lazily per event;
  // nothing to initialize here without a DSN configured. Reserved for future
  // monitor init (e.g. uptime heartbeat registration).
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { reportErrorAsync } = await import("@/lib/error-reporting");

  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unhandled server error");
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;

  // `request.headers` is a NodeJS.Dict<string | string[]> — flatten to strings.
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers ?? {})) {
    if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  await reportErrorAsync(err, {
    request: {
      method: request.method,
      url: request.path,
      headers,
    },
    digest,
    extra: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    },
  });
};
