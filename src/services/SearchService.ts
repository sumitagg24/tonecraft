import { chatRepository } from "@/repositories/ChatRepository";
import { messageRepository } from "@/repositories/MessageRepository";
import { prisma } from "@/lib/prisma";
import type { SearchResult } from "@/types";

export class SearchService {
  async search(userId: string, query: string): Promise<SearchResult> {
    if (!query.trim()) {
      return { chats: [], messages: [], prompts: [], personas: [], knowledge: [] };
    }

    const q = query.trim();
    const [chats, messages, prompts, personas, knowledge] = await Promise.all([
      chatRepository.search(userId, q),
      messageRepository.search(userId, q),
      prisma.prompt.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, description: true, category: true, content: true },
        take: 10,
      }),
      prisma.persona.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { systemPrompt: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, description: true, icon: true, color: true },
        take: 10,
      }),
      prisma.knowledgeFile.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { fileName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, fileName: true, fileType: true },
        take: 10,
      }),
    ]);

    return { chats, messages, prompts, personas, knowledge };
  }
}

export const searchService = new SearchService();
