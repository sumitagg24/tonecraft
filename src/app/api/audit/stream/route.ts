import { prisma } from "@/lib/prisma";
import { createPollingStreamRoute } from "@/lib/sse";

export const GET = createPollingStreamRoute({
  intervalMs: 15_000,
  createPoll: (userId) => {
    let lastSeen = 0;

    return async (send) => {
      const latest = await prisma.auditLog.findFirst({
        where: { actorId: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true },
      });
      if (!latest) return;

      const ts = latest.createdAt.getTime();
      if (ts <= lastSeen) return;
      lastSeen = ts;

      const recent = await prisma.auditLog.findMany({
        where: { actorId: userId, createdAt: { gte: new Date(ts - 60_000) } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, action: true, resource: true, createdAt: true },
      });
      send({ type: "audit_events", events: recent });
    };
  },
});
