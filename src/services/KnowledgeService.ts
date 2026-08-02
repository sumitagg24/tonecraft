import { prisma } from "@/lib/prisma";
import { extractText, detectMimeType } from "@/lib/knowledge/extract";
import { chunkText, searchScore } from "@/lib/knowledge/chunk";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_CHUNKS = 2000;
const MAX_FILES = 50;
const RETRIEVE_K = 6;

export interface RetrievedChunk {
  id: string;
  content: string;
  index: number;
  fileName: string;
  fileId: string;
  score: number;
}

export class KnowledgeService {
  async create(userId: string, fileName: string, buffer: Buffer, projectId?: string | null) {
    const fileCount = await prisma.knowledgeFile.count({ where: { userId } });
    if (fileCount >= MAX_FILES) {
      throw new Error("Knowledge file limit reached (50 files)");
    }
    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new Error("File too large (max 25MB)");
    }

    const mimeType = detectMimeType(fileName);
    const text = extractText(mimeType, buffer);
    if (!text) {
      throw new Error("No text could be extracted from this file");
    }

    const chunks = chunkText(text);
    if (chunks.length > MAX_CHUNKS) {
      throw new Error(`File too large to index (max ${MAX_CHUNKS} chunks)`);
    }

    return prisma.knowledgeFile.create({
      data: {
        userId,
        projectId: projectId ?? null,
        name: fileName.replace(/\.[^.]+$/, ""),
        fileName,
        fileType: mimeType,
        fileSize: buffer.byteLength,
        storageKey: `${userId}/${crypto.randomUUID()}-${fileName}`,
        status: "ready",
        chunks: {
          create: chunks.map((c) => ({
            index: c.index,
            content: c.content,
          })),
        },
      },
    });
  }

  async list(userId: string, projectId?: string | null) {
    return prisma.knowledgeFile.findMany({
      where: projectId ? { userId, projectId } : { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { chunks: true } } },
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return prisma.knowledgeFile.findFirst({ where: { id, userId } });
  }

  async remove(id: string, userId: string) {
    return prisma.knowledgeFile.deleteMany({ where: { id, userId } });
  }

  async rename(id: string, userId: string, name: string) {
    return prisma.knowledgeFile.updateMany({
      where: { id, userId },
      data: { name },
    });
  }

  async retrieve(userId: string, query: string, fileIds?: string[], k = RETRIEVE_K): Promise<RetrievedChunk[]> {
    const files = fileIds?.length
      ? await prisma.knowledgeFile.findMany({ where: { id: { in: fileIds }, userId, status: "ready" } })
      : await prisma.knowledgeFile.findMany({ where: { userId, status: "ready" } });

    const ids = files.map((f) => f.id);
    if (ids.length === 0) return [];

    const chunks = await prisma.knowledgeChunk.findMany({ where: { fileId: { in: ids } } });
    const fileNameById = new Map(files.map((f) => [f.id, f.fileName]));

    return chunks
      .map((c) => ({
        id: c.id,
        content: c.content,
        index: c.index,
        fileName: fileNameById.get(c.fileId) ?? "file",
        fileId: c.fileId,
        score: searchScore(query, c.content),
      }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  async linkToMessage(messageId: string, fileIds: string[]) {
    if (fileIds.length === 0) return;
    await prisma.messageKnowledge.createMany({
      data: fileIds.map((fileId) => ({ messageId, fileId })),
      skipDuplicates: true,
    });
  }
}

export const knowledgeService = new KnowledgeService();
