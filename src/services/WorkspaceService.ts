import { workspaceRepository } from "@/repositories/WorkspaceRepository";
import { projectRepository } from "@/repositories/ProjectRepository";
import { workspaceMemberRepository } from "@/repositories/WorkspaceMemberRepository";
import { workspaceInviteRepository } from "@/repositories/WorkspaceInviteRepository";
import { workspaceActivityRepository } from "@/repositories/WorkspaceActivityRepository";

export interface WorkspaceSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string;
  visibility: "public" | "private" | "shared";
  modes: string[];
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  _count: { projects: number; members: number };
}

export class WorkspaceService {
  async listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    return workspaceRepository.findByUserId(userId) as unknown as WorkspaceSummary[];
  }

  async getWorkspace(workspaceId: string, userId: string) {
    return workspaceRepository.findByIdAndUser(workspaceId, userId);
  }

  async getWorkspaceWithMembers(workspaceId: string) {
    return workspaceRepository.findByIdWithMembers(workspaceId);
  }

  async createWorkspace(userId: string, data: {
    name: string;
    description?: string;
    color?: string;
    visibility?: "public" | "private" | "shared";
    modes?: string[];
    settings?: Record<string, unknown>;
  }) {
    const workspace = await workspaceRepository.create({ userId, ...data });

    // Add creator as admin
    await workspaceMemberRepository.create({ workspaceId: workspace.id, userId, role: "admin" });

    // Log activity
    await workspaceActivityRepository.create({
      workspaceId: workspace.id,
      userId,
      type: "project_create",
      payload: { workspaceId: workspace.id, workspaceName: workspace.name },
    });

    return workspace;
  }

  async updateWorkspace(workspaceId: string, userId: string, data: Partial<{
    name: string;
    description: string;
    color: string;
    visibility: "public" | "private" | "shared";
    modes: string[];
    settings: Record<string, unknown>;
  }>): Promise<boolean> {
    const result = await workspaceRepository.update(workspaceId, userId, data);
    if (result) {
      await workspaceActivityRepository.create({
        workspaceId,
        userId,
        type: "project_update",
        payload: { changes: data },
      });
    }
    return result;
  }

  async updateWorkspaceSettings(workspaceId: string, userId: string, settings: Record<string, unknown>): Promise<boolean> {
    const result = await workspaceRepository.updateSettings(workspaceId, userId, settings);
    if (result) {
      await workspaceActivityRepository.create({
        workspaceId,
        userId,
        type: "project_update",
        payload: { settings },
      });
    }
    return result;
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<boolean> {
    // Move all projects to unfiled (workspaceId = null) before deletion
    await projectRepository.updateMany({ workspaceId }, { workspaceId: null });
    
    const result = await workspaceRepository.delete(workspaceId, userId);
    if (result) {
      await workspaceActivityRepository.create({
        workspaceId,
        userId,
        type: "project_delete",
        payload: { workspaceId },
      });
    }
    return result;
  }

  async getWorkspaceProjects(workspaceId: string, userId: string, includeArchived = false) {
    const workspace = await workspaceRepository.findByIdAndUser(workspaceId, userId);
    if (!workspace) return [];
    return workspaceRepository.listProjects(workspaceId, includeArchived);
  }

  async getWorkspaceProjectCount(workspaceId: string) {
    return workspaceRepository.countProjects(workspaceId);
  }
}

export const workspaceService = new WorkspaceService();