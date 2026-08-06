import { prisma } from "@/lib/prisma";

interface StorageOptimizationConfig {
  maxAutoSnapshotsPerResource: number;
  maxOperationHistoryPerResource: number;
  maxPresenceAgeMs: number;
  maxTypingAgeMs: number;
  sessionMaxAgeMs: number;
}

const defaultConfig: StorageOptimizationConfig = {
  maxAutoSnapshotsPerResource: 10,
  maxOperationHistoryPerResource: 100,
  maxPresenceAgeMs: 5 * 60 * 1000,
  maxTypingAgeMs: 30000,
  sessionMaxAgeMs: 30 * 60 * 1000,
};

export async function optimizeCollaborationStorage(config: Partial<StorageOptimizationConfig> = {}) {
  const cfg = { ...defaultConfig, ...config };
  let totalCleaned = 0;

  const stalePresences = await prisma.presence.deleteMany({
    where: { lastSeen: { lt: new Date(Date.now() - cfg.maxPresenceAgeMs) } },
  });
  totalCleaned += stalePresences.count;

  const staleTyping = await prisma.typingIndicator.deleteMany({
    where: { updatedAt: { lt: new Date(Date.now() - cfg.maxTypingAgeMs) } },
  });
  totalCleaned += staleTyping.count;

  const staleSessions = await prisma.collaborationSession.deleteMany({
    where: {
      OR: [
        { endedAt: { lt: new Date(Date.now() - cfg.sessionMaxAgeMs) } },
        { lastActivity: { lt: new Date(Date.now() - cfg.sessionMaxAgeMs) }, endedAt: null },
      ],
    },
  });
  totalCleaned += staleSessions.count;

  const snapshots = await prisma.versionSnapshot.findMany({
    where: { isAuto: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, resourceType: true, resourceId: true },
  });

  const snapshotGroups = new Map<string, string[]>();
  for (const snap of snapshots) {
    const key = `${snap.resourceType}:${snap.resourceId}`;
    const group = snapshotGroups.get(key) ?? [];
    group.push(snap.id);
    snapshotGroups.set(key, group);
  }

  for (const [, ids] of snapshotGroups) {
    if (ids.length > cfg.maxAutoSnapshotsPerResource) {
      const toDelete = ids.slice(cfg.maxAutoSnapshotsPerResource);
      await prisma.versionSnapshot.deleteMany({ where: { id: { in: toDelete } } });
      totalCleaned += toDelete.length;
    }
  }

  const operations = await prisma.documentOperation.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, resourceType: true, resourceId: true },
  });

  const opGroups = new Map<string, string[]>();
  for (const op of operations) {
    const key = `${op.resourceType}:${op.resourceId}`;
    const group = opGroups.get(key) ?? [];
    group.push(op.id);
    opGroups.set(key, group);
  }

  for (const [, ids] of opGroups) {
    if (ids.length > cfg.maxOperationHistoryPerResource) {
      const toDelete = ids.slice(cfg.maxOperationHistoryPerResource);
      await prisma.documentOperation.deleteMany({ where: { id: { in: toDelete } } });
      totalCleaned += toDelete.length;
    }
  }

  return { totalCleaned, config: cfg };
}