import { prisma } from "@/lib/prisma";

const projectSelect = {
  id: true,
  userId: true,
  workspaceId: true,
  name: true,
  emoji: true,
  color: true,
  description: true,
  parentId: true,
  archived: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class ProjectRepository {
  async findByUserId(userId: string, includeArchived = false) {
    return prisma.project.findMany({
      where: includeArchived ? { userId } : { userId, archived: false },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        ...projectSelect,
        _count: { select: { chats: true, children: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.project.findFirst({
      where: { id, userId },
      include: { members: true },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    emoji?: string;
    color?: string;
    description?: string;
    parentId?: string;
  }) {
    return prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        parentId: data.parentId,
      },
      select: projectSelect,
    });
  }

  async update(id: string, userId: string, data: Partial<{
    name: string;
    emoji: string;
    color: string;
    description: string;
    parentId: string | null;
    archived: boolean;
  }>) {
    const result = await prisma.project.updateMany({
      where: { id, userId },
      data: { ...data, updatedAt: new Date() },
    });
    return result.count > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.project.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async countChats(userId: string) {
    return prisma.chat.count({ where: { userId, isArchived: false, projectId: null } });
  }

  async listChats(projectId: string, includeArchived = false) {
    return prisma.chat.findMany({
      where: includeArchived
        ? { projectId }
        : { projectId, isArchived: false },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: { _count: { select: { messages: true } } },
    });
  }

  async moveChat(chatId: string, userId: string, projectId: string | null): Promise<boolean> {
    const result = await prisma.chat.updateMany({
      where: { id: chatId, userId },
      data: { projectId },
    });
    return result.count > 0;
  }

  async moveChatsToUnfiled(projectId: string): Promise<void> {
    await prisma.chat.updateMany({
      where: { projectId },
      data: { projectId: null },
    });
  }

   async createChat(data: { projectId: string; userId: string; title?: string }) {
    return prisma.chat.create({
      data: {
        userId: data.userId,
        title: data.title || "New Chat",
        projectId: data.projectId,
      },
    });
  }

  async updateMany(where: { workspaceId?: string; userId?: string }, data: Partial<{
    name: string;
    emoji: string;
    color: string;
    description: string;
    parentId: string | null;
    archived: boolean;
    workspaceId: string | null;
  }>) {
    return prisma.project.updateMany({ where, data: { ...data, updatedAt: new Date() } });
  }
}

export const projectRepository = new ProjectRepository();
