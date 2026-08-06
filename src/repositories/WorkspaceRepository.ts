import { Prisma, WorkspaceModes } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const workspaceSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  color: true,
  visibility: true,
  modes: true,
  settings: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class WorkspaceRepository {
  async findByUserId(userId: string) {
    return prisma.workspace.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        ...workspaceSelect,
        _count: { select: { projects: true, members: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.workspace.findFirst({
      where: { id, userId },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } },
    });
  }

  async findByIdWithMembers(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    description?: string;
    color?: string;
    visibility?: "public" | "private" | "shared";
    modes?: string[];
    settings?: Record<string, unknown>;
  }) {
    return prisma.workspace.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        color: data.color || "#6366F1",
        visibility: data.visibility || "private",
        modes: (data.modes || ["chat"]) as WorkspaceModes[],
        settings: (data.settings || {}) as Prisma.InputJsonValue,
      },
      select: workspaceSelect,
    });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    description: string;
    color: string;
    visibility: "public" | "private" | "shared";
    modes: string[];
    settings: Record<string, unknown>;
  }>) {
    const result = await prisma.workspace.updateMany({
      where: { id, userId },
      data: {
        ...data,
        modes: data.modes as WorkspaceModes[] | undefined,
        settings: data.settings as Prisma.InputJsonValue | undefined,
        updatedAt: new Date(),
      },
    });
    return result.count > 0;
  }

  async updateSettings(id: string, userId: string, settings: Record<string, unknown>) {
    const result = await prisma.workspace.updateMany({
      where: { id, userId },
      data: { settings: settings as Prisma.InputJsonValue, updatedAt: new Date() },
    });
    return result.count > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.workspace.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async addMember(workspaceId: string, userId: string, role: "member" | "manager" | "admin" = "member") {
    return prisma.workspaceMember.create({
      data: { workspaceId, userId, role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    const result = await prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
    return result.count > 0;
  }

  async updateMemberRole(workspaceId: string, userId: string, role: "member" | "manager" | "admin") {
    const result = await prisma.workspaceMember.updateMany({
      where: { workspaceId, userId },
      data: { role },
    });
    return result.count > 0;
  }

  async getMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async isMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return !!member;
  }

  async getMemberRole(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return member?.role || null;
  }

  async findByUserAndWorkspace(userId: string, workspaceId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
  }

  async countProjects(workspaceId: string) {
    return prisma.project.count({ where: { workspaceId } });
  }

  async listProjects(workspaceId: string, includeArchived = false) {
    return prisma.project.findMany({
      where: includeArchived ? { workspaceId } : { workspaceId, archived: false },
      orderBy: [{ updatedAt: "desc" }],
      include: { _count: { select: { chats: true } } },
    });
  }
}

export const workspaceRepository = new WorkspaceRepository();