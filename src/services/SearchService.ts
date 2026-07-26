import { chatRepository } from "@/repositories/ChatRepository";
import { messageRepository } from "@/repositories/MessageRepository";
import type { SearchResult } from "@/types";

export class SearchService {
  async search(userId: string, query: string): Promise<SearchResult> {
    if (!query.trim()) return { chats: [], messages: [] };

    const [chats, messages] = await Promise.all([
      chatRepository.search(userId, query),
      messageRepository.search(userId, query),
    ]);

    return { chats, messages };
  }
}

export const searchService = new SearchService();
