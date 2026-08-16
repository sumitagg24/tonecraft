import { prisma } from "@/lib/prisma";

/**
 * Shared resource-access checks (single source of truth — used by the
 * Socket.IO layer and the collaboration HTTP routes).
 *
 *  - Project: owner, ProjectMember, or a member of the project's workspace.
 *  - Chat: owner, or (via the chat's project) project access.
 */

export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  if (!projectId) return false;
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: { userId: true, workspaceId: true },
  });
  if (!project) return false;
  if (project.userId === userId) return true;
  if (
    await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    })
  ) {
    return true;
  }
  if (project.workspaceId) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
      select: { id: true },
    });
    if (member) return true;
  }
  return false;
}

export async function canAccessChat(userId: string, chatId: string): Promise<boolean> {
  if (!chatId) return false;
  const chat = await prisma.chat.findFirst({
    where: { id: chatId },
    select: { userId: true, projectId: true },
  });
  if (!chat) return false;
  if (chat.userId === userId) return true;
  if (chat.projectId) return canAccessProject(userId, chat.projectId);
  return false;
}

/** Resolve whether a caller may access a typed collaboration resource. */
export async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  if (resourceType === "chat") return canAccessChat(userId, resourceId);
  if (resourceType === "project") return canAccessProject(userId, resourceId);
  // Unknown resource types are denied (never default to allow).
  return false;
}
