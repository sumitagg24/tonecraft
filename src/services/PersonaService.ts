import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { promptService } from '@/services/PromptService';
import { promptRepository } from '@/repositories/PromptRepository';

export interface PersonaRecord {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  isDefault: boolean;
  isFavorite: boolean;
}

export interface PersonaMarketplaceItem {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: Date;
  userId: string;
}

export class PersonaMarketplaceService {
  // Get all personas for a user
  async listPersonas(userId: string) {
    return await prisma.persona.findMany({
      where: { userId },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // Get public personas (marketplace)
  async listPublicPersonas() {
    return await prisma.persona.findMany({
      where: { isDefault: false },
      orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // Get persona by ID
  async getPersona(id: string, userId: string) {
    return await prisma.persona.findUnique({
      where: { id, userId },
      include: { project: true },
    });
  }

  // Create a new persona
  async createPersona(userId: string, data: {
    name: string;
    description?: string;
    systemPrompt: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
    isFavorite?: boolean;
    projectId?: string;
  }) {
    const result = await promptService.createPrompt(userId, {
      title: data.name,
      description: data.description,
      content: data.systemPrompt,
      category: 'persona',
      variables: [],
      projectId: data.projectId,
      workspaceId: undefined,
    });

    await promptRepository.logAction('persona', {
      userId,
      action: 'create',
      metadata: { name: data.name, isPublic: data.isDefault ?? false },
    });

    return {
      id: result.id,
      name: result.title,
      description: result.description,
      systemPrompt: result.content,
      icon: data.icon,
      color: data.color,
      isDefault: data.isDefault ?? false,
      isFavorite: data.isFavorite ?? false,
      projectId: data.projectId,
    };
  }

  // Share persona with workspace
  async sharePersonaToWorkspace(personaId: string, workspaceId: string, permission: string = 'view') {
    return await promptRepository.createShare(personaId, '', {
      sharedWith: workspaceId,
      permission,
    });
  }

  // Export persona
  async exportPersona(personaId: string, userId: string) {
    const persona = await this.getPersona(personaId, userId);
    if (!persona) return null;

    return {
      name: persona.name,
      description: persona.description,
      systemPrompt: persona.systemPrompt,
      icon: persona.icon,
      color: persona.color,
      isDefault: persona.isDefault,
      isFavorite: persona.isFavorite,
      tone: persona.tone,
      temperature: persona.temperature,
      emojiUsage: persona.emojiUsage,
      writingStyle: persona.writingStyle,
      platformDefaults: persona.platformDefaults,
    };
  }

  // Import persona
  async importPersona(userId: string, data: {
    name: string;
    description?: string;
    systemPrompt: string;
    icon?: string;
    color?: string;
    isDefault?: boolean;
    isFavorite?: boolean;
    tone?: string;
    temperature?: number;
    emojiUsage?: string;
    writingStyle?: string;
    platformDefaults?: Record<string, string>;
    projectId?: string;
  }) {
    return await this.createPersona(userId, data);
  }

  // Get persona with workspace context
  async getPersonaWithWorkspace(personaId: string, userId: string, workspaceId?: string) {
    const persona = await this.getPersona(personaId, userId);
    if (!persona) return null;

    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { projects: true },
      });

      return {
        ...persona,
        workspace,
      };
    }

    return persona;
  }

  // Get marketplace items for workspace scope
  async listMarketplaceItems(workspaceId?: string, userId?: string) {
    const where: Prisma.PersonaWhereInput = {};
    if (workspaceId) {
      // Personas have no direct workspaceId column; filter through their project.
      where.project = { workspaceId };
    } else if (userId) {
      where.userId = userId;
    }

    return await prisma.persona.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
    });
  }

// Track usage statistics for personas
   async getPersonaUsageStats(personaId: string, userId: string) {
     const persona = await this.getPersona(personaId, userId);
     if (!persona) return null;

     const usage = await prisma.usage.findUnique({
       where: { userId },
       select: {
         messagesSent: true,
         tokensUsed: true,
         monthlyMessages: true,
         monthlyTokens: true,
       },
     });

     const usageStats = await prisma.promptHistory.count({
       where: { promptId: personaId, action: 'used_persona' },
     });

     return {
       personaId,
       ...usage,
       usageCount: usageStats,
     };
   }
 }

 export const personaMarketplaceService = new PersonaMarketplaceService();
