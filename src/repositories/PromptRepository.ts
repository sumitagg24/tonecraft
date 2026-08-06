import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface PromptVariable {
  name: string;
  value?: string;
}

export class PromptRepository {
  // Existing methods (keep these)
  async findByUserId(userId: string, isArchived?: boolean, projectId?: string) {
    return await prisma.prompt.findMany({
      where: {
        userId,
        projectId,
        isArchived: isArchived ?? false
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return await prisma.prompt.findFirst({
      where: { id, userId }
    });
  }

  async create(data: {
    userId: string;
    title: string;
    description?: string;
    content: string;
    category?: string;
    variables?: PromptVariable[];
    projectId?: string;
    workspaceId?: string;
  }) {
    return await prisma.prompt.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category ?? 'general',
        variables: data.variables as unknown as Prisma.InputJsonValue,
        projectId: data.projectId,
        workspaceId: data.workspaceId
      }
    });
  }

  async update(id: string, userId: string, data: Partial<{
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
    const result = await prisma.prompt.updateMany({
      where: { id, userId },
      data: {
        ...data,
        variables: data.variables !== undefined
          ? (data.variables as unknown as Prisma.InputJsonValue)
          : undefined,
      }
    });
    return result.count > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await prisma.prompt.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async listCategories(userId: string): Promise<string[]> {
    const categories = await prisma.prompt.findMany({
      where: { userId },
      select: { category: true },
      distinct: ['category']
    });
    return categories.map(c => c.category);
  }

  // COLLECTION METHODS
  async createCollection(userId: string, data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return await prisma.promptCollection.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async getCollection(id: string) {
    return await prisma.promptCollection.findUnique({
      where: { id }
    });
  }

  async listCollections(userId: string, includePublic?: boolean) {
    const where: any = { userId };
    if (includePublic) {
      where.OR = [
        { userId },
        { isPublic: true }
      ];
    }
    return await prisma.promptCollection.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateCollection(id: string, userId: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    return await prisma.promptCollection.update({
      where: { id },
      data
    });
  }

  async deleteCollection(id: string, userId: string): Promise<boolean> {
    const result = await prisma.promptCollection.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async addToCollection(collectionId: string, promptId: string, position?: number) {
    return await prisma.promptCollectionItem.create({
      data: {
        collectionId,
        promptId,
        position: position ?? 0
      }
    });
  }

  async removeFromCollection(collectionId: string, promptId: string): Promise<boolean> {
    const result = await prisma.promptCollectionItem.delete({
      where: {
        collectionId_promptId: {
          collectionId,
          promptId
        }
      }
    });
    return result !== null;
  }

  async listCollectionItems(collectionId: string) {
    return await prisma.promptCollectionItem.findMany({
      where: { collectionId },
      include: { prompt: true },
      orderBy: { position: 'asc' }
    });
  }

  async shareCollection(collectionId: string, userId: string, sharedWith: string, permission: string = 'view') {
    return await prisma.promptCollectionShare.create({
      data: {
        collectionId,
        sharedWithId: sharedWith,
        permission
      }
    });
  }

  // VERSION METHODS
  async createVersion(promptId: string, data: {
    title: string;
    description?: string;
    content: string;
    variables?: PromptVariable[];
    createdBy: string;
  }) {
    // Get current version number
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const versionNumber = (latestVersion?.version ?? 0) + 1;

    return await prisma.promptVersion.create({
      data: {
        promptId,
        version: versionNumber,
        title: data.title,
        description: data.description,
        content: data.content,
        variables: data.variables as unknown as Prisma.InputJsonValue,
        createdBy: data.createdBy
      }
    });
  }

  async getVersion(promptId: string, version: number) {
    return await prisma.promptVersion.findFirst({
      where: { promptId, version }
    });
  }

  async listVersions(promptId: string) {
    return await prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { version: 'desc' }
    });
  }

  async deleteVersion(promptId: string, version: number): Promise<boolean> {
    const result = await prisma.promptVersion.deleteMany({ where: { promptId, version } });
    return result.count > 0;
  }

  async restoreVersion(promptId: string, version: number, userId: string) {
    const versionData = await this.getVersion(promptId, version);
    if (!versionData) return null;

    // Create new version from the restored version
    return await this.createVersion(promptId, {
      title: versionData.title,
      description: versionData.description ?? undefined,
      content: versionData.content,
      variables: versionData.variables as unknown as PromptVariable[] | undefined,
      createdBy: userId
    });
  }

  // RATING METHODS
  async createRating(promptId: string, userId: string, data: {
    rating: number; // 1-5
    review?: string;
  }) {
    return await prisma.promptRating.upsert({
      where: {
        promptId_userId: {
          promptId,
          userId
        }
      },
      update: {
        rating: data.rating,
        review: data.review,
        updatedAt: new Date()
      },
      create: {
        promptId,
        userId,
        rating: data.rating,
        review: data.review
      }
    });
  }

  async getRating(promptId: string, userId: string) {
    return await prisma.promptRating.findUnique({
      where: {
        promptId_userId: {
          promptId,
          userId
        }
      }
    });
  }

  async getRatings(promptId: string) {
    return await prisma.promptRating.findMany({
      where: { promptId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAverageRating(promptId: string) {
    const result = await prisma.promptRating.aggregate({
      where: { promptId },
      _avg: { rating: true }
    });
    return result._avg.rating ?? 0;
  }

  // TAG METHODS
  async createTag(promptId: string, tagName: string) {
    return await prisma.promptTag.create({
      data: {
        promptId,
        name: tagName
      }
    });
  }

  async removeTag(promptId: string, tagName: string): Promise<boolean> {
    const result = await prisma.promptTag.delete({
      where: {
        promptId_name: {
          promptId,
          name: tagName
        }
      }
    });
    return result !== null;
  }

  async getTags(promptId: string) {
    return await prisma.promptTag.findMany({
      where: { promptId }
    });
  }

  async getPopularTags(limit: number = 10) {
    return await prisma.promptTag.groupBy({
      by: ['name'],
      _count: true,
      orderBy: {
        _count: { name: 'desc' }
      },
      take: limit
    });
  }

  // SHARE METHODS
  async createShare(promptId: string, userId: string, data: {
    sharedWith: string;
    permission?: string;
    expiresAt?: Date;
  }) {
    return await prisma.promptShare.create({
      data: {
        promptId,
        userId,
        sharedWithId: data.sharedWith,
        permission: data.permission ?? 'view',
        expiresAt: data.expiresAt
      }
    });
  }

  async revokeShare(promptId: string, userId: string): Promise<boolean> {
    const result = await prisma.promptShare.deleteMany({
      where: { promptId, userId }
    });
    return result.count > 0;
  }

  async getSharedWith(promptId: string) {
    return await prisma.promptShare.findMany({
      where: { promptId },
      include: { sharedWith: { select: { id: true, name: true, image: true } } }
    });
  }

  async getSharedWithMe(userId: string) {
    return await prisma.promptShare.findMany({
      where: { sharedWithId: userId },
      include: { prompt: true, user: { select: { id: true, name: true, image: true } } }
    });
  }

  // HISTORY METHODS
  async logAction(type: string, data: {
    promptId?: string;
    collectionId?: string;
    userId: string;
    action: string;
    metadata?: Record<string, any>;
  }) {
    return await prisma.promptHistory.create({
      data: {
        promptId: data.promptId,
        collectionId: data.collectionId,
        userId: data.userId,
        action: data.action,
        metadata: data.metadata as unknown as Prisma.InputJsonValue
      }
    });
  }

  // SEARCH METHODS
  async searchPrompts(userId: string, query: string, filters?: {
    category?: string;
    isFavorite?: boolean;
    tags?: string[];
  }) {
    const where: any = {
      OR: [
        { userId },
        { shares: { some: { sharedWithId: userId } } },
        { collectionItems: { some: { collection: { isPublic: true } } } }
      ]
    };

    if (query) {
      where.AND = [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        }
      ];
    }

    if (filters?.category) {
      where.AND = [...(where.AND || []), { category: { equals: filters.category } }];
    }

    if (filters?.isFavorite !== undefined) {
      where.AND = [...(where.AND || []), { isFavorite: { equals: filters.isFavorite } }];
    }

    if (filters?.tags?.length) {
      where.AND = [...(where.AND || []), {
        tags: {
          some: {
            name: { in: filters.tags }
          }
        }
      }];
    }

    return await prisma.prompt.findMany({
      where,
      include: {
        ratings: true,
        tags: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
}

export const promptRepository = new PromptRepository();
