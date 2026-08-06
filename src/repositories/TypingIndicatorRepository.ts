import { prisma } from "@/lib/prisma";

export class TypingIndicatorRepository {
  async setTyping(userId: string, chatId: string, isTyping: boolean) {
    if (isTyping) {
      return prisma.typingIndicator.upsert({
        where: { userId_chatId: { userId, chatId } },
        create: { userId, chatId, isTyping: true, startedAt: new Date() },
        update: { isTyping: true, updatedAt: new Date() },
      });
    }
    return prisma.typingIndicator.deleteMany({
      where: { userId, chatId },
    });
  }

  async findByChat(chatId: string) {
    return prisma.typingIndicator.findMany({
      where: { chatId, isTyping: true },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
  }

  async findByUser(userId: string) {
    return prisma.typingIndicator.findMany({
      where: { userId },
      include: { chat: { select: { id: true, title: true } } },
    });
  }

  async clearStale(maxAgeMs = 30000) {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const result = await prisma.typingIndicator.deleteMany({
      where: { updatedAt: { lt: cutoff } },
    });
    return result.count;
  }
}

export const typingIndicatorRepository = new TypingIndicatorRepository();