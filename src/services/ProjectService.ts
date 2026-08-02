import { projectRepository } from "@/repositories/ProjectRepository";
import type { Chat } from "@/types";

export interface ProjectSummary {
  id: string;
  userId: string;
  name: string;
  emoji: string | null;
  color: string;
  description: string | null;
  parentId: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { chats: number; children: number };
}

export class ProjectService {
  async listProjects(userId: string, includeArchived = false): Promise<ProjectSummary[]> {
    return projectRepository.findByUserId(userId, includeArchived) as unknown as ProjectSummary[];
  }

  async getProject(projectId: string, userId: string) {
    return projectRepository.findByIdAndUser(projectId, userId);
  }

  async createProject(userId: string, data: {
    name: string;
    emoji?: string;
    color?: string;
    description?: string;
    parentId?: string;
  }) {
    return projectRepository.create({ userId, ...data });
  }

  async updateProject(projectId: string, userId: string, data: Partial<{
    name: string; emoji: string; color: string; description: string; parentId: string | null; archived: boolean;
  }>): Promise<boolean> {
    return projectRepository.update(projectId, userId, data);
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    // chats move to Unfiled (projectId = null) before the project row is removed
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) return false;
    await projectRepository.moveChatsToUnfiled(projectId);
    return projectRepository.delete(projectId, userId);
  }

  async listProjectChats(projectId: string, userId: string): Promise<Chat[]> {
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) return [];
    return projectRepository.listChats(projectId) as unknown as Chat[];
  }

  async createProjectChat(projectId: string, userId: string, data?: { title?: string }) {
    const project = await projectRepository.findByIdAndUser(projectId, userId);
    if (!project) throw new Error("Project not found");
    return projectRepository.createChat({ projectId, userId, title: data?.title });
  }

  async moveChat(chatId: string, userId: string, projectId: string | null): Promise<boolean> {
    if (projectId) {
      const project = await projectRepository.findByIdAndUser(projectId, userId);
      if (!project) throw new Error("Project not found");
    }
    return projectRepository.moveChat(chatId, userId, projectId);
  }

  async getUnfiledCount(userId: string): Promise<number> {
    return projectRepository.countChats(userId);
  }
}

export const projectService = new ProjectService();
