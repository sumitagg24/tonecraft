import { prisma } from "@/lib/prisma";
import { extractText, detectMimeType } from "@/lib/knowledge/extract";
import { chunkText, searchScore } from "@/lib/knowledge/chunk";
import { v4 as uuidv4 } from "uuid";

const RETRIEVE_K = 6;

export interface RetrievedChunk {
  id: string;
  content: string;
  index: number;
  fileName: string;
  fileId: string;
  score: number;
}

export interface KnowledgeFileSummary {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  status: string;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class KnowledgeService {
  async create(
    userId: string,
    name: string,
    buffer: Buffer,
    projectId?: string | null
  ): Promise<KnowledgeFileSummary & { storageKey: string }> {
    const mimeType = detectMimeType(name);
    const text = extractText(mimeType, buffer);
    const chunks = chunkText(text);

    const file = await prisma.knowledgeFile.create({
      data: {
        userId,
        name,
        fileName: name,
        fileSize: buffer.length,
        fileType: mimeType,
        storageKey: `knowledge/${uuidv4()}`,
        status: "ready",
        projectId: projectId ?? undefined,
      },
    });

    if (chunks.length > 0) {
      await prisma.knowledgeChunk.createMany({
        data: chunks.map((c) => ({
          fileId: file.id,
          content: c.content,
          index: c.index,
        })),
      });
    }

    return {
      id: file.id,
      name: file.name,
      fileName: file.fileName,
      fileSize: file.fileSize,
      storageKey: file.storageKey,
      status: file.status,
      error: file.error,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  async list(userId: string, projectId?: string | null): Promise<KnowledgeFileSummary[]> {
    return prisma.knowledgeFile.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdAndUser(id: string, userId: string): Promise<KnowledgeFileSummary | null> {
    return prisma.knowledgeFile.findFirst({
      where: { id, userId },
    });
  }

  async rename(id: string, userId: string, name: string): Promise<{ count: number }> {
    return prisma.knowledgeFile.updateMany({
      where: { id, userId },
      data: { name },
    });
  }

  async remove(id: string, userId: string): Promise<{ count: number }> {
    return prisma.knowledgeFile.deleteMany({
      where: { id, userId },
    });
  }

  async linkToMessage(messageId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;
    await prisma.messageKnowledge.createMany({
      data: fileIds.map((fid) => ({ messageId, fileId: fid })),
    });
  }

  async retrieve(
    userId: string,
    query: string,
    fileIds?: string[],
    k = RETRIEVE_K
  ): Promise<RetrievedChunk[]> {
    const files = await prisma.knowledgeFile.findMany({
      where: {
        userId,
        status: "ready",
        ...(fileIds && fileIds.length ? { id: { in: fileIds } } : {}),
      },
      select: { id: true, name: true },
    });
    if (files.length === 0) return [];

    const fileMap = new Map(files.map((f) => [f.id, f.name]));
    const fileIdsForChunks = files.map((f) => f.id);

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { fileId: { in: fileIdsForChunks } },
      select: {
        id: true,
        content: true,
        index: true,
        fileId: true,
      },
    });

    return chunks
      .map((c) => ({
        id: c.id,
        content: c.content,
        index: c.index,
        fileName: fileMap.get(c.fileId) ?? "unknown",
        fileId: c.fileId,
        score: searchScore(query, c.content),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export const knowledgeService = new KnowledgeService();
