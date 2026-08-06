import { prisma } from "@/lib/prisma";
import { promptRepository } from "@/repositories/PromptRepository";
import type { PromptVariable } from "@/repositories/PromptRepository";

export interface PromptCreateInput {
  title: string;
  description?: string;
  content: string;
  category?: string;
  variables?: PromptVariable[];
  projectId?: string;
  workspaceId?: string;
}

export interface CollectionCreateInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface CollectionUpdateInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface RatingInput {
  rating: number;
  review?: string;
}

export interface SearchFilters {
  category?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export class PromptService {
  async listPrompts(userId: string, projectId?: string, options?: { isArchived?: boolean }) {
    return promptRepository.findByUserId(userId, options?.isArchived, projectId);
  }

  async getPrompt(id: string, userId: string) {
    return promptRepository.findByIdAndUser(id, userId);
  }

  async createPrompt(userId: string, data: PromptCreateInput) {
    return promptRepository.create({ userId, ...data });
  }

  async updatePrompt(id: string, userId: string, data: Partial<{
    title: string;
    description: string;
    content: string;
    category: string;
    variables: PromptVariable[];
    isFavorite: boolean;
    isArchived: boolean;
    projectId: string | null;
    workspaceId: string | null;
  }>): Promise<boolean> {
    return promptRepository.update(id, userId, data);
  }

  async deletePrompt(id: string, userId: string): Promise<boolean> {
    return promptRepository.delete(id, userId);
  }

  async listCategories(userId: string): Promise<string[]> {
    return promptRepository.listCategories(userId);
  }

  /**
   * Render a template by replacing {{variable}} tokens.
   */
  renderTemplate(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) =>
      variables[name]?.trim() ?? `{{${name}}}`
    );
  }

  extractVariables(content: string): string[] {
    const names = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) names.add(m[1]);
    return [...names];
  }

  // COLLECTION OPERATIONS
  async createCollection(userId: string, data: CollectionCreateInput) {
    const collection = await promptRepository.createCollection(userId, data);
    await promptRepository.logAction('collection', {
      userId,
      collectionId: collection.id,
      action: 'create',
      metadata: { name: data.name }
    });
    return collection;
  }

  async getCollection(id: string, _userId?: string) {
    return promptRepository.getCollection(id);
  }

  async listCollections(userId: string, includePublic: boolean = false) {
    return promptRepository.listCollections(userId, includePublic);
  }

  async updateCollection(id: string, userId: string, data: CollectionUpdateInput) {
    const collection = await promptRepository.updateCollection(id, userId, data);
    await promptRepository.logAction('collection', {
      userId,
      collectionId: id,
      action: 'update',
      metadata: data as unknown as Record<string, unknown>
    });
    return collection;
  }

  async deleteCollection(id: string, userId: string): Promise<boolean> {
    const success = await promptRepository.deleteCollection(id, userId);
    if (success) {
      await promptRepository.logAction('collection', {
        userId,
        collectionId: id,
        action: 'delete'
      });
    }
    return success;
  }

  async addPromptToCollection(promptId: string, collectionId: string, userId: string) {
    // Verify user owns the prompt or has access
    const prompt = await promptRepository.findByIdAndUser(promptId, userId);
    if (!prompt) return null;

    // Log the action
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'add_to_collection',
      metadata: { collectionId }
    });

    return promptRepository.addToCollection(collectionId, promptId);
  }

  async removePromptFromCollection(collectionId: string, promptId: string, userId: string) {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'remove_from_collection',
      metadata: { collectionId }
    });
    return promptRepository.removeFromCollection(collectionId, promptId);
  }

  async shareCollection(collectionId: string, userId: string, sharedWith: string, permission: string = 'view') {
    await promptRepository.logAction('collection', {
      userId,
      collectionId,
      action: 'share',
      metadata: { sharedWith, permission }
    });
    return promptRepository.shareCollection(collectionId, userId, sharedWith, permission);
  }

  // VERSION OPERATIONS
  async createVersion(promptId: string, data: {
    title: string;
    description?: string;
    content: string;
    variables?: PromptVariable[];
    userId: string;
  }) {
    // Log the version creation
    await promptRepository.logAction('prompt', {
      userId: data.userId,
      promptId,
      action: 'create_version',
      metadata: { title: data.title }
    });

    return promptRepository.createVersion(promptId, {
      ...data,
      createdBy: data.userId
    });
  }

  async getVersion(promptId: string, version: number) {
    return promptRepository.getVersion(promptId, version);
  }

  async listVersions(promptId: string) {
    return promptRepository.listVersions(promptId);
  }

  async restoreVersion(promptId: string, version: number, userId: string) {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'restore_version',
      metadata: { version }
    });
    return promptRepository.restoreVersion(promptId, version, userId);
  }

  async deletePromptVersion(promptId: string, version: number, userId: string): Promise<boolean> {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'delete_version',
      metadata: { version }
    });
    return promptRepository.deleteVersion(promptId, version);
  }

  // RATING OPERATIONS
  async createRating(promptId: string, userId: string, data: RatingInput) {
    // Log the rating
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'rate',
      metadata: { rating: data.rating }
    });

    return promptRepository.createRating(promptId, userId, data);
  }

  async getRating(promptId: string, userId: string) {
    return promptRepository.getRating(promptId, userId);
  }

  async getRatings(promptId: string) {
    return promptRepository.getRatings(promptId);
  }

  async getAverageRating(promptId: string) {
    return promptRepository.getAverageRating(promptId);
  }

  // TAG OPERATIONS
  async addTag(promptId: string, tagName: string, userId: string) {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'add_tag',
      metadata: { tag: tagName }
    });
    return promptRepository.createTag(promptId, tagName);
  }

  async removeTag(promptId: string, tagName: string, userId: string): Promise<boolean> {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'remove_tag',
      metadata: { tag: tagName }
    });
    return promptRepository.removeTag(promptId, tagName);
  }

  async getTags(promptId: string) {
    return promptRepository.getTags(promptId);
  }

  async getPopularTags(limit: number = 10) {
    return promptRepository.getPopularTags(limit);
  }

  // SHARE OPERATIONS
  async sharePrompt(promptId: string, userId: string, data: {
    sharedWith: string;
    permission?: 'view' | 'edit' | 'manage';
    expiresAt?: Date;
  }) {
    // Log the share
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'share',
      metadata: { sharedWith: data.sharedWith, permission: data.permission }
    });

    return promptRepository.createShare(promptId, userId, {
      sharedWith: data.sharedWith,
      permission: data.permission,
      expiresAt: data.expiresAt
    });
  }

  async revokeShare(promptId: string, userId: string): Promise<boolean> {
    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: 'revoke_share'
    });
    return promptRepository.revokeShare(promptId, userId);
  }

  async getSharedWithMe(userId: string) {
    return promptRepository.getSharedWithMe(userId);
  }

  // SEARCH OPERATIONS
  async searchPrompts(userId: string, query: string, filters?: SearchFilters) {
    return promptRepository.searchPrompts(userId, query, filters);
  }

  // FAVORITE OPERATIONS
  async toggleFavorite(promptId: string, userId: string): Promise<boolean> {
    const prompt = await promptRepository.findByIdAndUser(promptId, userId);
    if (!prompt) return false;

    await promptRepository.update(promptId, userId, {
      isFavorite: !prompt.isFavorite
    });

    await promptRepository.logAction('prompt', {
      userId,
      promptId,
      action: prompt.isFavorite ? 'unfavorite' : 'favorite'
    });

    return true;
  }

  // EXPORT/IMPORT OPERATIONS
  async exportCollection(collectionId: string, userId: string) {
    const collection = await promptRepository.getCollection(collectionId);
    if (!collection || collection.userId !== userId) return null;

    const items = await promptRepository.listCollectionItems(collectionId);
    return {
      collection: {
        name: collection.name,
        description: collection.description,
        isPublic: collection.isPublic
      },
      prompts: items.map(item => ({
        id: item.promptId,
        content: item.prompt.content,
        variables: item.prompt.variables
      }))
    };
  }

  async importCollection(userId: string, data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    prompts: Array<{ title: string; content: string; variables?: PromptVariable[] }>;
  }) {
    const collection = await promptRepository.createCollection(userId, {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic ?? false
    });

    for (const promptData of data.prompts) {
      await promptRepository.create({
        userId,
        ...promptData,
        category: 'imported'
      });
    }

    return collection;
  }

// USAGE STATISTICS
   async getUsageStats(userId: string) {
     const usage = await prisma.user.findUnique({
       where: { id: userId },
       select: {
         usage: {
          select: {
            messagesSent: true,
            tokensUsed: true,
            filesUploaded: true,
            storageUsed: true,
            monthlyMessages: true,
            monthlyTokens: true
          }
        }
      }
    });

    const promptCount = await prisma.prompt.count({ where: { userId } });
    const collectionCount = await prisma.promptCollection.count({ where: { userId } });
    const ratingCount = await prisma.promptRating.count({ where: { userId } });

    return {
      usage: usage?.usage || {
        messagesSent: 0,
        tokensUsed: 0,
        filesUploaded: 0,
        storageUsed: 0,
        monthlyMessages: 0,
        monthlyTokens: 0
      },
      promptCount,
      collectionCount,
      ratingCount
    };
  }
}

export const promptService = new PromptService();