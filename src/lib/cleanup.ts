import { prisma } from "@/lib/prisma";

export async function cleanupExpiredInvites() {
  const result = await prisma.workspaceInvite.updateMany({
    where: {
      status: "pending",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}

export async function cleanupStalePresence(maxAgeMs = 5 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await prisma.presence.deleteMany({
    where: { lastSeen: { lt: cutoff } },
  });
  return result.count;
}

export async function cleanupStaleTypingIndicators(maxAgeMs = 30000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await prisma.typingIndicator.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
  return result.count;
}

export async function cleanupStaleCollaborationSessions(maxAgeMs = 30 * 60 * 1000) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await prisma.collaborationSession.deleteMany({
    where: {
      endedAt: { lte: cutoff },
      lastActivity: { lt: cutoff },
    },
  });
  return result.count;
}