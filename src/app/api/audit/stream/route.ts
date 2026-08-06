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
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      sendEvent(JSON.stringify({ type: "connected" }));

      let lastSeen = 0;

      const pollInterval = setInterval(async () => {
        try {
          const latest = await prisma.auditLog.findFirst({
            where: { actorId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          });

          if (latest) {
            const ts = latest.createdAt.getTime();
            if (ts > lastSeen) {
              lastSeen = ts;
              const since = new Date(ts - 60_000);
              const recent = await prisma.auditLog.findMany({
                where: {
                  actorId: session.user.id,
                  createdAt: { gte: since },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: { id: true, action: true, resource: true, createdAt: true },
              });
              sendEvent(JSON.stringify({ type: "audit_events", events: recent }));
            }
          }
        } catch {
          sendEvent(JSON.stringify({ type: "error", message: "poll failed" }));
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
