import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Shared plumbing for the polling SSE endpoints (`/api/notifications/stream`,
 * `/api/audit/stream`). These keep the native `text/event-stream` protocol
 * rather than the JSON envelope of `withApiHandler`.
 *
 * A route supplies only its poll body: `createPoll(userId)` is called once per
 * connection (so cursors live in its closure, per connection) and the returned
 * poll runs every `intervalMs`, emitting payloads with `send()`. Auth, the
 * initial `{ type: "connected" }` event, per-poll error events, interval
 * cleanup on client abort, and the SSE response headers are handled here.
 */

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

/** Emits one SSE `data:` frame; objects are JSON-serialized. */
export type SseSend = (payload: unknown) => void;

/** One polling tick. Throwing emits `{ type: "error", message: "poll failed" }`. */
export type SsePoll = (send: SseSend) => Promise<void>;

export interface PollingStreamOptions {
  /** How often the poll runs, in milliseconds. */
  intervalMs: number;
  /** Builds the poll for one connection — keep per-connection cursors here. */
  createPoll: (userId: string) => SsePoll;
}

/**
 * Builds an authenticated SSE `GET` route handler that pushes events produced
 * by a periodic poll.
 */
export function createPollingStreamRoute({ intervalMs, createPoll }: PollingStreamOptions) {
  return async function GET(req: NextRequest): Promise<NextResponse> {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const poll = createPoll(userId);
        const send: SseSend = (payload) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        send({ type: "connected" });

        const pollInterval = setInterval(async () => {
          try {
            await poll(send);
          } catch {
            send({ type: "error", message: "poll failed" });
          }
        }, intervalMs);

        try {
          await new Promise<void>((resolve) => {
            req.signal.addEventListener("abort", () => resolve());
          });
        } finally {
          clearInterval(pollInterval);
          controller.close();
        }
      },
    });

    return new NextResponse(stream, { headers: SSE_HEADERS });
  };
}
