import { prisma } from "@/lib/prisma";

/**
 * Ownership/membership checks for the collaboration surfaces (presence, typing,
 * sessions, version history, activity feeds). Those routes take a
 * client-supplied resource id, so they must verify the caller can actually see
 * that resource before reading or writing anything scoped to it.
 *
 * Unknown resource types are denied — a new resource type must opt in here
 * rather than silently becoming world-readable.
 */

export async function canAccessChat(chatId: string, userId: string): Promise<boolean> {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  });
  return chat !== null;
}

export async function canAccessProject(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  return project !== null;
}

export async function canAccessWorkspace(workspaceId: string, userId: string): Promise<boolean> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { id: true },
  });
  return member !== null;
}

/**
 * Resolves the memory owner a caller is allowed to act on. Returns the owner id
 * to use, or null when the caller has no claim to it (the route answers 403).
 * `"me"` is the client-side alias for the caller's own memory.
 *
 * `team`/`agent` owners have no membership model yet, so they are denied rather
 * than trusted from the request body.
 */
export async function resolveMemoryOwner(
  ownerType: "user" | "workspace" | "team" | "agent",
  ownerId: string,
  userId: string
): Promise<string | null> {
  if (ownerType === "user") {
    return ownerId === "me" || ownerId === userId ? userId : null;
  }
  if (ownerType === "workspace") {
    return (await canAccessWorkspace(ownerId, userId)) ? ownerId : null;
  }
  return null;
}

export async function canAccessResource(
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  switch (resourceType) {
    case "chat":
      return canAccessChat(resourceId, userId);
    case "project":
      return canAccessProject(resourceId, userId);
    case "workspace":
      return canAccessWorkspace(resourceId, userId);
    default:
      return false;
  }
}
