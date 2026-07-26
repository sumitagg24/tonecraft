import { prisma } from "@/lib/prisma";
import type { Chat } from "@/types";

const chatSelect = {
  id: true,
  userId: true,
  title: true,
  tone: true,
  model: true,
  platform: true,
  language: true,
  isPinned: true,
  isFavorite: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
} as const;

function asChat<T>(val: T): T {
  return val;
}

export class ChatRepository {
  async findByUserId(userId: string, includeArchived = false) {
    const where: Record<string, unknown> = { userId };
    if (!includeArchived) where.isArchived = false;
    return prisma.chat.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      select: { ...chatSelect, _count: { select: { messages: true } } },
    }) as unknown as Chat[];
  }

  async findById(id: string) {
    return prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
      },
    }) as unknown as Chat | null;
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.chat.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
      },
    }) as unknown as Chat | null;
  }

  async create(data: { userId: string; title?: string; tone?: string; platform?: string; language?: string }) {
    return prisma.chat.create({
      data: {
        userId: data.userId,
        title: data.title || "New Chat",
        tone: data.tone || "professional",
        platform: data.platform,
        language: data.language,
      },
      select: chatSelect,
    }) as unknown as Chat;
  }

  async update(id: string, userId: string, data: Partial<{
    title: string; tone: string; model: string;
    platform: string; language: string;
    isPinned: boolean; isFavorite: boolean; isArchived: boolean;
  }>): Promise<boolean> {
    const result = await prisma.chat.updateMany({
      where: { id, userId },
      data: { ...data, updatedAt: new Date() },
    });
    return result.count > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.chat.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async search(userId: string, query: string, limit = 20) {
    return prisma.chat.findMany({
      where: {
        userId,
        isArchived: false,
        title: { contains: query, mode: "insensitive" },
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { ...chatSelect, _count: { select: { messages: true } } },
    }) as unknown as Chat[];
  }

  async getPinned(userId: string) {
    return prisma.chat.findMany({
      where: { userId, isPinned: true, isArchived: false },
      orderBy: { updatedAt: "desc" },
      select: chatSelect,
    }) as unknown as Chat[];
  }

  async getFavorites(userId: string) {
    return prisma.chat.findMany({
      where: { userId, isFavorite: true, isArchived: false },
      orderBy: { updatedAt: "desc" },
      select: chatSelect,
    }) as unknown as Chat[];
  }
}

export const chatRepository = new ChatRepository();
