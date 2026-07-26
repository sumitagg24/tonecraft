import { chatRepository } from "@/repositories/ChatRepository";
import type { Chat } from "@/types";

export class ChatService {
  async listChats(userId: string): Promise<Chat[]> {
    return chatRepository.findByUserId(userId);
  }

  async getChat(chatId: string, userId: string): Promise<Chat | null> {
    return chatRepository.findByIdAndUser(chatId, userId);
  }

  async createChat(userId: string, data?: { title?: string; tone?: string; platform?: string; language?: string }): Promise<Chat> {
    return chatRepository.create({ userId, ...data });
  }

  async updateChat(chatId: string, userId: string, data: Partial<{
    title: string; tone: string; isPinned: boolean;
    isFavorite: boolean; isArchived: boolean;
  }>): Promise<boolean> {
    return chatRepository.update(chatId, userId, data);
  }

  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    return chatRepository.delete(chatId, userId);
  }

  async togglePin(chatId: string, userId: string, pinned: boolean): Promise<boolean> {
    return chatRepository.update(chatId, userId, { isPinned: pinned });
  }

  async toggleFavorite(chatId: string, userId: string, favorite: boolean): Promise<boolean> {
    return chatRepository.update(chatId, userId, { isFavorite: favorite });
  }

  async archiveChat(chatId: string, userId: string, archived: boolean): Promise<boolean> {
    return chatRepository.update(chatId, userId, { isArchived: archived });
  }

  async renameChat(chatId: string, userId: string, title: string): Promise<boolean> {
    return chatRepository.update(chatId, userId, { title });
  }

  async getPinnedChats(userId: string): Promise<Chat[]> {
    return chatRepository.getPinned(userId);
  }

  async getFavoriteChats(userId: string): Promise<Chat[]> {
    return chatRepository.getFavorites(userId);
  }
}

export const chatService = new ChatService();
