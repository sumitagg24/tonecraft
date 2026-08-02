import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const userId = session.user.id;

      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      sendEvent(JSON.stringify({ type: "connected" }));

      const pollInterval = setInterval(async () => {
        try {
          const unread = await prisma.notification.count({
            where: { userId, readAt: null },
          });
          sendEvent(
            JSON.stringify({
              type: "unread_count",
              count: unread,
            })
          );
        } catch {
          sendEvent(
            JSON.stringify({ type: "error", message: "poll failed" })
          );
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        controller.close();
      });

      try {
        await new Promise<void>((resolve) => {
          req.signal.addEventListener("abort", () => resolve());
        });
      } finally {
        clearInterval(pollInterval);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}