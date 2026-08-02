/**
 * Error monitoring abstraction (audit 12 P0.6).
 *
 * Routes errors to an external service when configured. Today that service is
 * Sentry via a minimal, dependency-free envelope client — no SDK install
 * required. Swapping in @sentry/nextjs later means changing only the
 * `sendError` implementation below; every call site (`logger.error`, route
 * handlers) stays the same.
 *
 * Activation:
 *   SENTRY_DSN=https://<public_key>@o<org>.ingest.sentry.io/<project_id>
 *   (server-side errors)
 *   NEXT_PUBLIC_SENTRY_DSN=...   (client-side errors)
 */

type ErrorReporter = {
  reportError(error: unknown, context?: Record<string, unknown>): void;
  flush?(): Promise<void>;
};

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

async function sendError(error: unknown, context?: Record<string, unknown>): Promise<void> {
  const dsn = getDsn();
  if (!dsn) return; // not configured — no-op

  try {
    const parsed = new URL(dsn);
    const publicKey = parsed.username || parsed.host.split("@")[0];
    const projectId = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (!publicKey || !projectId || !parsed.host) return;

    const eventId = normalizeEventId();
    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Reported error");
    const frames = parseStackFrames(err.stack);

    const event = {
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
      extra: context ? Object.fromEntries(Object.entries(context).map(([k, v]) => [k, serializeValue(v)])) : undefined,
    };

    const envelope = [
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn }),
      JSON.stringify({ type: "event", content_type: "application/json" }),
      JSON.stringify(event),
    ].join("\n");

    await fetch(`https://${parsed.host}/api/${projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=tonecraft/1.0, sentry_key=${publicKey}`,
      },
      body: envelope,
    });
  } catch {
    // reporting must never throw into the app
  }
}

/** Fire-and-forget error reporting. Never throws. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!getDsn()) return;
  void sendError(error, context);
}

export const errorReporter: ErrorReporter = {
  reportError,
  async flush() {
    // No-op: sendError is awaited fire-and-forget; add batching here if needed.
  },
};
