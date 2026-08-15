import { versionSnapshotRepository } from "@/repositories/VersionSnapshotRepository";
import { documentOperationRepository } from "@/repositories/DocumentOperationRepository";
import type { VersionSnapshot } from "@prisma/client";

export type { VersionSnapshot } from "@prisma/client";

export interface SnapshotCreateInput {
  resourceType: string;
  resourceId: string;
  userId: string;
  title?: string;
  content: Record<string, unknown>;
  diff?: Record<string, unknown>;
  changeType: string;
  changeSummary?: string;
  isAuto?: boolean;
  parentId?: string;
}

export interface SnapshotRestoreResult {
  content: Record<string, unknown>;
  version: number;
  changeType: string;
  changeSummary?: string | null;
}

export interface SnapshotDiffResult {
  base: Record<string, unknown>;
  target: Record<string, unknown>;
  diff?: Record<string, unknown>;
  changeType: string;
  changeSummary?: string | null;
}

export interface VersionChainEntry {
  id: string;
  version: number;
  title: string | null;
  changeType: string;
  changeSummary: string | null;
  sizeBytes: number;
  isAuto: boolean;
  createdAt: Date;
  user?: { id: string; name: string | null };
}

export class VersionHistoryService {
  async createSnapshot(data: SnapshotCreateInput): Promise<VersionSnapshot> {
    const { isAuto = false, ...rest } = data;
    const latest = await versionSnapshotRepository.findLatest(rest.resourceType, rest.resourceId);
    const version = (latest?.version ?? 0) + 1;
    const sizeBytes = new TextEncoder().encode(JSON.stringify(rest.content)).byteLength;
    return versionSnapshotRepository.create({ ...rest, version, sizeBytes, isAuto });
  }

  async getById(id: string): Promise<VersionSnapshot | null> {
    return versionSnapshotRepository.findById(id);
  }

  async getLatest(resourceType: string, resourceId: string): Promise<VersionSnapshot | null> {
    return versionSnapshotRepository.findLatest(resourceType, resourceId);
  }

  async listVersions(resourceType: string, resourceId: string, page = 1, perPage = 20): Promise<{ items: VersionSnapshot[]; total: number }> {
    const items = await versionSnapshotRepository.findByResource(resourceType, resourceId, page, perPage);
    const total = await versionSnapshotRepository.countByResource(resourceType, resourceId);
    return { items, total };
  }

  async restore(id: string): Promise<SnapshotRestoreResult | null> {
    const result = await versionSnapshotRepository.restore(id);
    if (!result) return null;
    return {
      ...result,
      content: result.content as Record<string, unknown>,
    };
  }

  async diff(id: string): Promise<SnapshotDiffResult | null> {
    const result = await versionSnapshotRepository.diff(id);
    if (!result) return null;
    return {
      ...result,
      base: result.base as Record<string, unknown>,
      target: result.target as Record<string, unknown>,
      diff: result.diff as Record<string, unknown> | undefined,
    };
  }

  async getVersionChain(resourceType: string, resourceId: string): Promise<VersionChainEntry[]> {
    return versionSnapshotRepository.getVersionChain(resourceType, resourceId) as unknown as VersionChainEntry[];
  }

  async pruneAutoSnapshots(resourceType: string, resourceId: string, keepCount = 10): Promise<number> {
    return versionSnapshotRepository.deleteOldAutoSnapshots(resourceType, resourceId, keepCount);
  }

  async getStorageStats(resourceType?: string) {
    return versionSnapshotRepository.getStorageStats(resourceType);
  }

  async recordOperation(data: {
    resourceType: string;
    resourceId: string;
    userId: string;
    version: number;
    operation: Record<string, unknown>;
    baseVersion: number;
  }) {
    return documentOperationRepository.create(data);
  }

  async getPendingOperations(resourceType: string, resourceId: string, baseVersion: number) {
    return documentOperationRepository.findPending(resourceType, resourceId, baseVersion);
  }

  async markOperationApplied(id: string) {
    return documentOperationRepository.markApplied(id);
  }

  async getLatestVersion(resourceType: string, resourceId: string): Promise<number> {
    return documentOperationRepository.getLatestVersion(resourceType, resourceId);
  }

  async pruneOperations(resourceType: string, resourceId: string, keepCount = 100) {
    return documentOperationRepository.pruneOld(resourceType, resourceId, keepCount);
  }
}

export const versionHistoryService = new VersionHistoryService();