import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractText, detectMimeType } from "@/lib/knowledge/extract";
import { chunkText, searchScore } from "@/lib/knowledge/chunk";
import { embed, toJsonVector, fromJsonVector, cosineSimilarity } from "@/lib/embeddings";
import { queueService } from "@/services/QueueService";
import { logger } from "@/lib/logger";
import { isStorageConfigured, uploadObject, deleteObject, sanitizeObjectName } from "@/lib/storage";
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
    const text = await extractText(mimeType, buffer);
    const chunks = chunkText(text);

    // Persist the original file to R2 when configured (chunks in Postgres are
    // the retrieval source; the object enables re-download). Graceful fallback:
    // without storage the file still indexes — only the raw file isn't kept.
    const storageKey = `knowledge/${userId}/${uuidv4()}-${sanitizeObjectName(name)}`;
    let storedKey: string | null = null;
    if (isStorageConfigured()) {
      try {
        await uploadObject({ key: storageKey, body: buffer, contentType: mimeType });
        storedKey = storageKey;
      } catch (error) {
        logger.warn("[Knowledge] R2 upload skipped, indexing in Postgres only", {
          fileName: name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const file = await prisma.knowledgeFile.create({
      data: {
        userId,
        name,
        fileName: name,
        fileSize: buffer.length,
        fileType: mimeType,
        storageKey: storedKey ?? `knowledge/${uuidv4()}`,
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

    // Phase 12.5 — heavy embedding generation runs in the background queue
    // rather than blocking the upload request.
    void queueService
      .enqueue("embedding", { knowledgeFileId: file.id, chunkCount: chunks.length, userId })
      .catch(() => {});

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
    // Best-effort: remove the R2 object too when it exists and belongs to the
    // user (key prefix is the ownership proof). The DB delete is authoritative.
    const file = await prisma.knowledgeFile.findFirst({
      where: { id, userId },
      select: { storageKey: true },
    });
    const result = await prisma.knowledgeFile.deleteMany({
      where: { id, userId },
    });
    if (file?.storageKey?.startsWith(`knowledge/${userId}/`)) {
      await deleteObject(file.storageKey);
    }
    return result;
  }

  async linkToMessage(messageId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;
    await prisma.messageKnowledge.createMany({
      data: fileIds.map((fid) => ({ messageId, fileId: fid })),
    });
  }

  /**
   * Files whose chunks still lack vectors (uploaded before the embedding path
   * existed, or whose queue job failed). Distinct fileIds, oldest first.
   */
  async findFilesMissingEmbeddings(limit: number): Promise<string[]> {
    const rows = await prisma.knowledgeChunk.findMany({
      where: { embedding: { equals: Prisma.DbNull } },
      distinct: ["fileId"],
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { fileId: true },
    });
    return rows.map((r) => r.fileId);
  }

  /**
   * Backfill: embed every chunk of files that have none. Runs daily (bounded
   * by `limit` per run) so pre-embedding uploads eventually get vectors without
   * hammering the embeddings provider. Idempotent — already-embedded files are
   * untouched.
   */
  async backfillEmbeddings(limit = 25): Promise<{ files: number; chunks: number }> {
    const fileIds = await this.findFilesMissingEmbeddings(limit);
    let chunks = 0;
    for (const fileId of fileIds) {
      try {
        const result = await this.embedFile(fileId);
        chunks += result.embedded;
      } catch (error) {
        logger.error("[Knowledge] backfill embed failed", {
          fileId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { files: fileIds.length, chunks };
  }

  /**
   * Generate and store an embedding for every chunk of a knowledge file. Runs
   * in the background queue (`embedding` job) so uploads never block on vector
   * generation. Uses the configured embeddings provider when available and the
   * deterministic hash fallback otherwise (see lib/embeddings).
   */
  async embedFile(fileId: string, userId?: string): Promise<{ embedded: number; fileId: string }> {
    // Ownership guard — only embed files the job's owner actually created.
    const file = await prisma.knowledgeFile.findFirst({
      where: { id: fileId, ...(userId ? { userId } : {}) },
      select: { id: true },
    });
    if (!file) {
      // Orphaned job (file deleted since enqueue) — nothing to embed.
      logger.warn("[Knowledge] embedFile: file not found", { fileId, userId });
      return { embedded: 0, fileId };
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { fileId },
      select: { id: true, content: true, embedding: true },
      orderBy: { index: "asc" },
    });
    if (chunks.length === 0) return { embedded: 0, fileId };
    // Skip chunks that already have a vector (idempotent re-runs).
    const todo = chunks.filter((c) => fromJsonVector(c.embedding) === null);
    if (todo.length === 0) return { embedded: 0, fileId };

    // Embed sequentially to keep memory bounded (chunk contents are small).
    for (const chunk of todo) {
      const vector = await embed(chunk.content);
      await prisma.knowledgeChunk.update({
        where: { id: chunk.id },
        data: { embedding: toJsonVector(vector) as Prisma.InputJsonValue },
      });
    }

    // File is ready for retrieval; record the job on the tracker.
    await prisma.knowledgeFile.update({
      where: { id: fileId },
      data: { status: "ready" },
    });
    await prisma.knowledgeJob.upsert({
      where: { fileId },
      create: { fileId, status: "complete", attempts: 1 },
      update: { status: "complete", error: null, attempts: { increment: 1 } },
    });

    logger.info("[Knowledge] embedded file", { fileId, chunks: todo.length });
    return { embedded: todo.length, fileId };
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
        embedding: true,
      },
    });

    // Semantic retrieval: when chunks carry embeddings (embedFile job ran with
    // a configured provider OR the hash fallback), blend vector cosine with the
    // lexical score. Without vectors, fall back to lexical-only (same as before).
    const hasVectors = chunks.some((c) => fromJsonVector(c.embedding) !== null);
    const queryVector = hasVectors ? await embed(query) : null;

    return chunks
      .map((c) => {
        const lexical = searchScore(query, c.content);
        let semantic = 0;
        if (queryVector) {
          const vec = fromJsonVector(c.embedding);
          if (vec) semantic = cosineSimilarity(queryVector, vec);
        }
        // 0.7 semantic / 0.3 lexical when both exist; the stronger signal
        // alone otherwise. Vector dims can differ between hash (384) and a
        // provider model, but cosine handles both since it's per-row.
        const score = queryVector ? semantic * 0.7 + lexical * 0.3 : lexical;
        return {
          id: c.id,
          content: c.content,
          index: c.index,
          fileName: fileMap.get(c.fileId) ?? "unknown",
          fileId: c.fileId,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export const knowledgeService = new KnowledgeService();
