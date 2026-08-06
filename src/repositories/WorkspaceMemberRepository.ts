import { prisma } from "@/lib/prisma";
import { MemberRole } from "@prisma/client";

export class WorkspaceMemberRepository {
  async create(data: { workspaceId: string; userId: string; role: MemberRole }) {
    return prisma.workspaceMember.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role,
      },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
  }

  async findByUser(userId: string) {
    return prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: { select: { id: true, name: true, color: true } }, user: { select: { id: true, name: true, email: true, image: true } } },
    });
  }

  async findByWorkspaceAndUser(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { user: { select: { id: true, name: true, email: true, image: true } }, workspace: true },
    });
  }

  async updateRole(workspaceId: string, userId: string, role: MemberRole) {
    return prisma.workspaceMember.updateMany({
      where: { workspaceId, userId },
      data: { role },
    });
  }

  async remove(workspaceId: string, userId: string) {
    return prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
  }
}

export const workspaceMemberRepository = new WorkspaceMemberRepository();