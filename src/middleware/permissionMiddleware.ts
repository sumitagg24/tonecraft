import { prisma } from "@/lib/prisma";

type WorkspaceRole = "member" | "manager" | "admin";

/**
 * Role hierarchy: admin ≥ manager ≥ member. A role grants access to actions
 * at or below its level — an admin satisfies a "manager"-level requirement.
 * Missing membership (or a nonexistent workspace) resolves to "none".
 */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  member: 1,
  manager: 2,
  admin: 3,
};

type RoleCheck = WorkspaceRole | "none" | "denied";

class PermissionMiddleware {
  async requireWorkspaceRole(workspaceId: string, userId: string, requiredRole: WorkspaceRole): Promise<boolean> {
    return (await this.checkWorkspaceRole(workspaceId, userId, requiredRole)) === requiredRole;
  }

  async requireProjectRole(projectId: string, userId: string, requiredRole: "member" | "manager" | "admin"): Promise<boolean> {
    // Project-level membership: the owner is implicitly the top role; a
    // ProjectMember row grants the recorded role. Deny when neither exists.
    const project = await prisma.project.findFirst({
      where: { id: projectId },
      select: { userId: true },
    });
    if (!project) return false;
    if (project.userId === userId) return true;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    if (!member) return false;

    if (requiredRole === "member") return true;
    // Project roles are a flat viewer/editor/admin string set by the owner;
    // treat any recorded role as satisfying member/manager, and only "admin"
    // satisfies admin.
    if (requiredRole === "manager") return member.role !== "viewer";
    return member.role === "admin";
  }

  async isWorkspaceMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return !!member;
  }

  async checkWorkspaceRole(workspaceId: string, userId: string, requiredRole: WorkspaceRole): Promise<RoleCheck> {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });

    if (!member) return "none";

    // Hierarchy: member.role >= requiredRole grants access.
    if (ROLE_RANK[member.role] >= ROLE_RANK[requiredRole]) return member.role;
    return "denied";
  }
}

export const permissionMiddleware = new PermissionMiddleware();
