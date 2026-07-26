import { prisma } from "@/lib/prisma";
import type { UserPreferences } from "@/types";

export class UserRepository {
  async findByClerkId(clerkId: string) {
    return prisma.user.findUnique({ where: { clerkId } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, image: true,
        preferredLanguage: true, defaultTone: true,
        preferredPlatform: true, preferredStyle: true,
        preferredModel: true, creativityLevel: true,
        responseLength: true, autoSave: true, streamingEnabled: true,
      },
    });
  }

  async updatePreferences(id: string, prefs: Partial<UserPreferences>) {
    const data: any = {};
    if (prefs.preferredLanguage !== undefined) data.preferredLanguage = prefs.preferredLanguage;
    if (prefs.preferredTone !== undefined) data.defaultTone = prefs.preferredTone;
    if (prefs.preferredPlatform !== undefined) data.preferredPlatform = prefs.preferredPlatform;
    if (prefs.preferredStyle !== undefined) data.preferredStyle = prefs.preferredStyle;
    if (prefs.preferredModel !== undefined) data.preferredModel = prefs.preferredModel;
    if (prefs.creativityLevel !== undefined) data.creativityLevel = prefs.creativityLevel;
    if (prefs.responseLength !== undefined) data.responseLength = prefs.responseLength;
    if (prefs.autoSave !== undefined) data.autoSave = prefs.autoSave;
    if (prefs.streamingEnabled !== undefined) data.streamingEnabled = prefs.streamingEnabled;

    return prisma.user.update({ where: { id }, data });
  }

  async getPreferences(id: string): Promise<UserPreferences | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      preferredLanguage: user.preferredLanguage,
      preferredTone: user.defaultTone,
      preferredPlatform: user.preferredPlatform || "email",
      preferredStyle: user.preferredStyle || "standard",
      preferredModel: user.preferredModel || "auto",
      creativityLevel: user.creativityLevel || 70,
      responseLength: user.responseLength || "medium",
      autoSave: user.autoSave,
      streamingEnabled: user.streamingEnabled,
      darkMode: false,
    };
  }

  async updateProfile(id: string, data: { name?: string; image?: string }) {
    return prisma.user.update({ where: { id }, data });
  }
}

export const userRepository = new UserRepository();
