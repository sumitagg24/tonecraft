import * as Sentry from "@sentry/nextjs";

/**
 * Error monitoring abstraction (audit 12 P0.6, Phase 13 server wiring).
 *
 * Routes errors to Sentry via a minimal, dependency-free envelope client — no
 * SDK install required. Swapping in @sentry/nextjs later means changing only
 * the `sendError` implementation below; every call site (`logger.error`, route
 * handlers, `instrumentation.ts`) stays the same.
 *
 * Activation:
 *   SENTRY_DSN=https://<public_key>@o<org>.ingest.sentry.io/<project_id>
 *   (server-side errors)
 *   NEXT_PUBLIC_SENTRY_DSN=...   (client-side errors)
 *
 * Server-side reliability:
 *  - `reportError` stays fire-and-forget for hot paths (route handlers, logger).
 *  - `reportErrorAsync` is awaited by server hooks that must not lose events
 *    (Next 16 `onRequestError` in `src/instrumentation.ts`).
 *  - `flush()` awaits all in-flight sends — call it before serverless functions
 *    / cron workers return when delivery must be guaranteed.
 */

type ErrorReporter = {
  reportError(error: unknown, context?: Record<string, unknown>): void;
  reportErrorAsync(error: unknown, context?: Record<string, unknown>): Promise<void>;
  flush?(): Promise<void>;
};

/** Rich context attached to server-reported events (route handlers, RSC errors). */
export interface ReportContext extends Record<string, unknown> {
  /** Request info (method, url, user agent) — surfaced in Sentry's request panel. */
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  };
  /** Authenticated user id — linked to the user in Sentry. */
  userId?: string;
  /** Next.js digest for RSC-processed errors (see instrumentation.ts). */
  digest?: string;
  /** App-provided metadata. */
  extra?: Record<string, unknown>;
}

const inFlight = new Set<Promise<void>>();

function getDsn(): string | undefined {
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
}

function normalizeEventId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
}

function parseStackFrames(stack?: string): Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> {
  if (!stack) return [];
  const frames: Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> = [];
  for (const line of stack.split("\n").slice(1)) {
    const match = line.match(/at\s+(.*?)\s*\(?(.*?):(\d+):(\d+)\)?\s*$/);
    if (match) {
      frames.push({
        function: match[1] !== "<unknown>" ? match[1] : undefined,
        filename: match[2],
        lineno: Number(match[3]),
        colno: Number(match[4]),
      });
    }
  }
  return frames.slice(0, 50);
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return { message: value.message, name: value.name, stack: value.stack };
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  return value;
}

function pickHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  // Only forward low-cardinality headers — never cookies/auth tokens. The
  // referer's query string is dropped since it can carry sensitive params.
  const allowed = ["user-agent", "x-forwarded-for", "x-vercel-id", "referer", "content-type"];
  const picked: Record<string, string> = {};
  for (const key of allowed) {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (!value) continue;
    if (key.toLowerCase() === "referer") {
      try {
        const url = new URL(value);
        picked[key] = `${url.origin}${url.pathname}`;
      } catch {
        picked[key] = value;
      }
    } else {
      picked[key] = value;
    }
  }
  return Object.keys(picked).length > 0 ? picked : undefined;
}

interface BuiltEvent {
  event: Record<string, unknown>;
  host: string;
  publicKey: string;
  projectId: string;
}

function buildEvent(error: unknown, context?: ReportContext): BuiltEvent | null {
  const dsn = getDsn();
  if (!dsn) return null;

  try {
    const parsed = new URL(dsn);
    const publicKey = parsed.username || parsed.host.split("@")[0];
    const projectId = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (!publicKey || !projectId || !parsed.host) return null;

    const eventId = normalizeEventId();
    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Reported error");
    const frames = parseStackFrames(err.stack);

    const event: Record<string, unknown> = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      logger: "tonecraft",
      server_name: process.env.VERCEL_REGION ?? process.env.HOSTNAME ?? undefined,
      exception: {
        values: [
          {
            type: err.name,
            value: err.message,
            stacktrace: { frames },
          },
        ],
      },
    };

    if (context?.digest) {
      event.digest = context.digest;
    }
    if (context?.userId) {
      event.user = { id: context.userId };
    }
    if (context?.request?.url || context?.request?.method) {
      event.request = {
        url: context.request.url,
        method: context.request.method,
        headers: pickHeaders(context.request.headers),
      };
    }
    const extra = { ...(context?.extra ?? {}) };
    if (context) {
      // Any remaining top-level context keys ride along as extra.
      for (const [k, v] of Object.entries(context)) {
        if (["request", "userId", "digest", "extra"].includes(k)) continue;
        extra[k] = v;
      }
    }
    if (Object.keys(extra).length > 0) {
      event.extra = Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, serializeValue(v)]));
    }

    return { event, host: parsed.host, publicKey, projectId };
  } catch {
    return null;
  }
}

async function sendError(error: unknown, context?: ReportContext): Promise<void> {
  const built = buildEvent(error, context);
  if (!built) return; // not configured or malformed DSN — no-op

  // The real @sentry/nextjs SDK is now the primary path: when it's initialized
  // (sentry.server.config / instrumentation-client), delegate to it so events
  // get request/tracing context and dedup. The envelope client below remains
  // the fallback for environments where the SDK isn't loaded (unit tests only).
  if (Sentry.getClient()) {
    // Mirror the legacy path's rich context: user, digest, request metadata,
    // and any remaining top-level keys swept into extra.
    const extra: Record<string, unknown> = { ...(context?.extra ?? {}) };
    if (context?.request) extra.request = context.request;
    if (context) {
      for (const [k, v] of Object.entries(context)) {
        if (["request", "userId", "digest", "extra"].includes(k)) continue;
        extra[k] = v;
      }
    }
    Sentry.captureException(error, {
      user: context?.userId ? { id: context.userId } : undefined,
      tags: context?.digest ? { digest: context.digest } : undefined,
      extra,
    });
    return;
  }

  const { event, host, publicKey, projectId } = built;

  const envelope = [
    JSON.stringify({ event_id: event.event_id as string, sent_at: new Date().toISOString(), dsn: getDsn() }),
    JSON.stringify({ type: "event", content_type: "application/json" }),
    JSON.stringify(event),
  ].join("\n");

  await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=tonecraft/1.0, sentry_key=${publicKey}`,
    },
    body: envelope,
  });
}

function track(promise: Promise<void>): Promise<void> {
  inFlight.add(promise);
  promise.finally(() => inFlight.delete(promise));
  return promise;
}

/** Fire-and-forget error reporting. Never throws. (Hot paths: logger, handlers.) */
export function reportError(error: unknown, context?: ReportContext): void {
  if (!getDsn()) return;
  void track(
    sendError(error, context).catch(() => {
      // reporting must never throw into the app
    })
  );
}

/** Awaited error reporting for server hooks that must not lose events. Never throws. */
export async function reportErrorAsync(error: unknown, context?: ReportContext): Promise<void> {
  if (!getDsn()) return;
  await track(
    sendError(error, context).catch(() => {
      // reporting must never throw into the app
    })
  );
}

/** Wait for every in-flight report to finish. Call before serverless exit. */
export async function flushErrorReports(): Promise<void> {
  while (inFlight.size > 0) {
    await Promise.allSettled([...inFlight]);
  }
}

export const errorReporter: ErrorReporter = {
  reportError,
  reportErrorAsync,
  async flush() {
    await flushErrorReports();
  },
};
