import { prisma } from "@/lib/prisma";

class PermissionMiddleware {
  async requireWorkspaceRole(_workspaceId: string, _role: "member" | "manager" | "admin") {
    // Implementation will be in API route handlers
  }

  async requireProjectRole(_projectId: string, _role: "member" | "manager" | "admin") {
    // Implementation will be in API route handlers
  }

  async isWorkspaceMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return !!member;
  }

  async checkWorkspaceRole(workspaceId: string, userId: string, requiredRole: "member" | "manager" | "admin") {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    
    if (!member) return "none";
    
    if (member.role === requiredRole) return member.role;
    
    if (requiredRole === "admin" && member.role !== "admin") return "denied";
    if (requiredRole === "manager" && member.role !== "manager") return "denied";
    if (requiredRole === "member" && member.role === "member") return "member";
    
    return "denied";
  }
}

export const permissionMiddleware = new PermissionMiddleware();