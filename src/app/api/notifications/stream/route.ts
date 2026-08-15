import { prisma } from "@/lib/prisma";
import { createPollingStreamRoute } from "@/lib/sse";

export const GET = createPollingStreamRoute({
  intervalMs: 10_000,
  createPoll: (userId) => {
    let lastCount = 0;
    let lastPoll = 0;

    return async (send) => {
      const now = Date.now();

      const unread = await prisma.notification.count({
        where: { userId, readAt: null },
      });

      if (unread !== lastCount) {
        lastCount = unread;
        send({ type: "unread_count", count: unread });
      }

      if (now - lastPoll > 5_000) {
        lastPoll = now;
        const recent = await prisma.notification.findMany({
          where: { userId, createdAt: { gte: new Date(now - 30_000) } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            link: true,
            readAt: true,
            createdAt: true,
          },
        });

        if (recent.length > 0) {
          send({ type: "notifications", notifications: recent });
        }
      }
    };
  },
});
