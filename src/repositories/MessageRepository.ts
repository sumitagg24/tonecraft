import { prisma } from "@/lib/prisma";
import type { Message } from "@/types";

export class MessageRepository {
  async findByChatId(chatId: string, limit = 50, offset = 0) {
    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
      include: { attachments: true },
    }) as unknown as Message[];
  }

  async findById(id: string) {
    return prisma.message.findUnique({
      where: { id },
      include: { attachments: true },
    }) as unknown as Message | null;
  }

  async create(data: {
    chatId: string; role: string; content: string;
    tone?: string; platform?: string; language?: string;
    model?: string; tokens?: number; latency?: number;
  }) {
    return prisma.message.create({
      data: {
        chatId: data.chatId,
        role: data.role,
        content: data.content,
        tone: data.tone,
        platform: data.platform,
        language: data.language,
        model: data.model,
        tokens: data.tokens,
        latency: data.latency,
      },
      include: { attachments: true },
    }) as unknown as Message;
  }

  async update(id: string, data: Partial<{
    content: string; model: string; tokens: number;
    latency: number; isEdited: boolean; editedAt: Date;
    feedback: string | null;
  }>): Promise<boolean> {
    const result = await prisma.message.update({ where: { id }, data });
    return !!result;
  }

  async updateFeedback(id: string, feedback: "liked" | "disliked" | null): Promise<boolean> {
    const result = await prisma.message.update({ where: { id }, data: { feedback } });
    return !!result;
  }

  async regenerate(originalMessage: Message, newContent: string, model: string, tokens: number, latency: number) {
    return prisma.message.create({
      data: {
        chatId: originalMessage.chatId,
        role: "assistant",
        content: newContent,
        tone: originalMessage.tone,
        model, tokens, latency,
        parentId: originalMessage.id,
      },
      include: { attachments: true },
    }) as unknown as Message;
  }

  async search(userId: string, query: string, limit = 20) {
    const messages = await prisma.message.findMany({
      where: {
        chat: { userId, isArchived: false },
        content: { contains: query, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, content: true, chatId: true, role: true, createdAt: true,
      },
    });
    return messages.map(m => ({
      id: m.id,
      content: m.content.length > 200 ? m.content.slice(0, 200) + "..." : m.content,
      chatId: m.chatId,
      role: m.role as "user" | "assistant" | "system",
      createdAt: m.createdAt,
    }));
  }

  async countByChatId(chatId: string): Promise<number> {
    return prisma.message.count({ where: { chatId } });
  }
}

export const messageRepository = new MessageRepository();
