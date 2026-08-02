import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface PersonaRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string | null;
  color: string;
  isDefault: boolean;
  isFavorite: boolean;
  tone: string;
  temperature: number | null;
  emojiUsage: string;
  writingStyle: string;
  platformDefaults: Record<string, string> | null;
  projectId: string | null;
  createdAt: Date;
}

export class PersonaService {
  async list(userId: string, projectId?: string) {
    return prisma.persona.findMany({
      where: projectId ? { userId, projectId } : { userId },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    }) as unknown as PersonaRecord[];
  }

  async create(userId: string, data: Partial<PersonaRecord>) {
    return prisma.persona.create({
      data: {
        userId,
        name: data.name || "New Persona",
        description: data.description,
        systemPrompt: data.systemPrompt || "",
        icon: data.icon,
        color: data.color || "#6366F1",
        tone: data.tone || "professional",
        temperature: data.temperature,
        emojiUsage: data.emojiUsage || "subtle",
        writingStyle: data.writingStyle || "standard",
        platformDefaults: data.platformDefaults as Prisma.InputJsonValue | undefined,
        isFavorite: data.isFavorite ?? false,
        projectId: data.projectId,
      },
    }) as unknown as PersonaRecord;
  }

  async update(id: string, userId: string, data: Record<string, unknown>) {
    const result = await prisma.persona.updateMany({
      where: { id, userId },
      data: {
        ...data,
        platformDefaults: data.platformDefaults as Prisma.InputJsonValue | undefined,
      },
    });
    return result.count > 0;
  }

  async remove(id: string, userId: string) {
    const result = await prisma.persona.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async setDefault(userId: string, personaId: string | null) {
    await prisma.user.update({ where: { id: userId }, data: { defaultPersonaId: personaId } });
  }
}

export const personaService = new PersonaService();
