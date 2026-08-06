import { presenceRepository } from "@/repositories/PresenceRepository";
import { typingIndicatorRepository } from "@/repositories/TypingIndicatorRepository";
import { collaborationSessionRepository } from "@/repositories/CollaborationSessionRepository";
import { documentOperationRepository } from "@/repositories/DocumentOperationRepository";
import { versionHistoryService } from "@/services/VersionHistoryService";

export interface UserPresence {
  userId: string;
  projectId?: string;
  chatId?: string;
  status: string;
  cursorX?: number;
  cursorY?: number;
  selectionStart?: number;
  selectionEnd?: number;
  currentPath?: string;
  lastSeen: Date;
  user?: { id: string; name: string | null; image: string | null };
}

export interface TypingUser {
  userId: string;
  chatId: string;
  user?: { id: string; name: string | null; image: string | null };
}

export interface ConflictResolutionResult {
  resolved: boolean;
  mergedContent?: Record<string, unknown>;
  conflictFields?: string[];
  strategy: string;
}

export class CollaborationService {
  async updatePresence(data: {
    userId: string;
    projectId?: string;
    chatId?: string;
    status?: string;
    cursorX?: number;
    cursorY?: number;
    selectionStart?: number;
    selectionEnd?: number;
    currentPath?: string;
  }): Promise<UserPresence> {
    return presenceRepository.upsert(data) as unknown as UserPresence;
  }

  async getProjectPresences(projectId: string): Promise<UserPresence[]> {
    return presenceRepository.findByProject(projectId) as unknown as UserPresence[];
  }

  async getChatPresences(chatId: string): Promise<UserPresence[]> {
    return presenceRepository.findByChat(chatId) as unknown as UserPresence[];
  }

  async removeStalePresences(maxAgeMs = 5 * 60 * 1000): Promise<number> {
    return presenceRepository.removeStale(maxAgeMs);
  }

  async setTyping(userId: string, chatId: string, isTyping: boolean): Promise<void> {
    await typingIndicatorRepository.setTyping(userId, chatId, isTyping);
  }

  async getChatTypingUsers(chatId: string): Promise<TypingUser[]> {
    return typingIndicatorRepository.findByChat(chatId) as unknown as TypingUser[];
  }

  async clearStaleTyping(maxAgeMs = 30000): Promise<number> {
    return typingIndicatorRepository.clearStale(maxAgeMs);
  }

  async createSession(data: {
    projectId?: string;
    chatId?: string;
    resourceType: string;
    resourceId: string;
    participants: string[];
  }) {
    return collaborationSessionRepository.create(data);
  }

  async getActiveSession(resourceType: string, resourceId: string) {
    return collaborationSessionRepository.findActive(resourceType, resourceId);
  }

  async endSession(id: string) {
    return collaborationSessionRepository.endSession(id);
  }

  async endResourceSessions(resourceType: string, resourceId: string) {
    return collaborationSessionRepository.endByResource(resourceType, resourceId);
  }

  async resolveConflict(data: {
    resourceType: string;
    resourceId: string;
    baseVersion: number;
    incomingOps: Record<string, unknown>[];
    currentContent: Record<string, unknown>;
  }): Promise<ConflictResolutionResult> {
    const pending = await documentOperationRepository.findPending(
      data.resourceType,
      data.resourceId,
      data.baseVersion
    );

    if (pending.length === 0) {
      return { resolved: true, strategy: "no-conflict" };
    }

    const conflictFields = this.detectConflicts(pending, data.incomingOps);

    if (conflictFields.length === 0) {
      return { resolved: true, strategy: "merge" };
    }

    return {
      resolved: false,
      conflictFields,
      strategy: "last-write-wins",
    };
  }

  private detectConflicts(
    pending: Array<{ operation: unknown }>,
    incoming: Record<string, unknown>[]
  ): string[] {
    const pendingFields = new Set<string>();
    for (const op of pending) {
      if (op.operation && typeof op.operation === "object") {
        Object.keys(op.operation as Record<string, unknown>).forEach((k) => pendingFields.add(k));
      }
    }
    const incomingFields = new Set<string>();
    for (const op of incoming) {
      Object.keys(op).forEach((k) => incomingFields.add(k));
    }
    const conflicts: string[] = [];
    for (const field of pendingFields) {
      if (incomingFields.has(field)) {
        conflicts.push(field);
      }
    }
    return conflicts;
  }
}

export const collaborationService = new CollaborationService();