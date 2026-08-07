import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { embed, cosineSimilarity, toJsonVector, fromJsonVector } from "@/lib/embeddings";
import type { MemoryOwnerType, Prisma } from "@prisma/client";

export interface RememberInput {
  ownerType: MemoryOwnerType;
  ownerId: string;
  content: string;
  metadata?: Record<string, unknown>;
  importance?: number;
}

export interface RecallOptions {
  ownerType: MemoryOwnerType;
  ownerId: string;
  query?: string;
  limit?: number;
  minScore?: number;
  source?: string;
}

export interface ContextBuildInput {
  userId: string;
  query?: string;
  workspaceId?: string;
  agentId?: string;
  projectId?: string;
}

/**
 * Phase 17 — AI Memory System.
 *
 * - `remember`: store a fact with an embedding + importance.
 * - `recall`: semantic retrieval (embedding cosine) blended with recency,
 *   then bump importance/lastAccessedAt on hit.   * - `buildContext`: assembles a context bundle (memory + recent chats +
   *   knowledge + tasks + calendar) for the AI Context Builder.
 * - `graph`: knowledge-graph queries over linked memory items.
 */
export class MemoryService {
  /** Importance decay: 1% per day since creation/access, floor at 5. */
  static decayedImportance(importance: number, lastAccessedAt: Date, now: Date = new Date()): number {
    const days = Math.max(0, (now.getTime() - lastAccessedAt.getTime()) / 86_400_000);
    return Math.max(5, Math.round(importance * Math.pow(0.99, days)));
  }

  /** Pure recall ranker: cosine 0–1 blended with recency 0–1. */
  static rank(score: number, ageDays: number, importance: number): number {
    const recency = Math.max(0, 1 - ageDays / 90);
    return Number((score * 0.65 + recency * 0.2 + (importance / 100) * 0.15).toFixed(4));
  }

  async remember(input: RememberInput) {
    const vector = await embed(input.content);
    const item = await prisma.memoryItem.create({
      data: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        content: input.content.trim(),
        embedding: toJsonVector(vector) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        importance: Math.min(100, Math.max(0, input.importance ?? 50)),
      },
    });
    logger.debug(`[Memory] remembered ${item.id} for ${input.ownerType}:${input.ownerId}`);
    return item;
  }

  /** Store multiple facts atomically (e.g. extracted from a chat turn). */
  async rememberMany(items: RememberInput[]) {
    const vector = await Promise.all(items.map((i) => embed(i.content)));
    return prisma.$transaction(
      items.map((item, idx) =>
        prisma.memoryItem.create({
          data: {
            ownerType: item.ownerType,
            ownerId: item.ownerId,
            content: item.content.trim(),
            embedding: toJsonVector(vector[idx]) as Prisma.InputJsonValue,
            metadata: (item.metadata ?? {}) as Prisma.InputJsonValue,
            importance: Math.min(100, Math.max(0, item.importance ?? 50)),
          },
        }),
      ),
    );
  }

  /** Semantic recall with importance bump on hit. */
  async recall(options: RecallOptions) {
    const { ownerType, ownerId, query, limit = 8, minScore = 0.15 } = options;
    const items = await prisma.memoryItem.findMany({
      where: {
        ownerType,
        ownerId,
        ...(options.source ? { metadata: { path: ["source"], equals: options.source } } : {}),
      },
      orderBy: { importance: "desc" },
      take: 200,
    });

    let queryVector: number[] | null = null;
    if (query?.trim()) {
      queryVector = await embed(query.trim());
    }

    const now = new Date();
    const ranked = items
      .map((item) => {
        const vec = fromJsonVector(item.embedding);
        const score = queryVector && vec ? cosineSimilarity(queryVector, vec) : 0;
        const ageDays = (now.getTime() - item.lastAccessedAt.getTime()) / 86_400_000;
        const imp = MemoryService.decayedImportance(item.importance, item.lastAccessedAt, now);
        return { item, score, rank: queryVector ? MemoryService.rank(score, ageDays, imp) : imp / 100 };
      })
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit)
      .filter((r) => (queryVector ? r.rank >= minScore : true));

    if (ranked.length > 0) {
      const ids = ranked.map((r) => r.item.id);
      await prisma.memoryItem.updateMany({
        where: { id: { in: ids } },
        data: {
          importance: { increment: 2 },
          lastAccessedAt: now,
        },
      });
    }

    return ranked.map((r) => ({
      id: r.item.id,
      content: r.item.content,
      metadata: r.item.metadata,
      importance: MemoryService.decayedImportance(r.item.importance, r.item.lastAccessedAt, now) + 2,
      score: r.rank,
    }));
  }

  /** List recent memories for an owner (management UI). */
  async list(ownerType: MemoryOwnerType, ownerId: string, limit = 50) {
    return prisma.memoryItem.findMany({
      where: { ownerType, ownerId },
      orderBy: [{ importance: "desc" }, { lastAccessedAt: "desc" }],
      take: limit,
      select: { id: true, content: true, metadata: true, importance: true, lastAccessedAt: true, createdAt: true },
    });
  }

  async remove(id: string): Promise<boolean> {
    try {
      await prisma.memoryItem.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async clear(ownerType: MemoryOwnerType, ownerId: string) {
    const { count } = await prisma.memoryItem.deleteMany({ where: { ownerType, ownerId } });
    return count;
  }

  /** Link two memories (knowledge graph edge). */
  async link(fromId: string, toId: string, relation = "relates_to") {
    if (fromId === toId) return null;
    try {
      return await prisma.memoryLink.upsert({
        where: { fromId_toId_relation: { fromId, toId, relation } },
        create: { fromId, toId, relation },
        update: {},
      });
    } catch {
      return null;
    }
  }

  /** One-hop neighborhood of a memory (graph visualization). */
  async graph(ownerType: MemoryOwnerType, ownerId: string) {
    const items = await prisma.memoryItem.findMany({
      where: { ownerType, ownerId },
      take: 100,
      select: { id: true, content: true },
    });
    const links = await prisma.memoryLink.findMany({
      where: { OR: [{ from: { ownerType, ownerId } }, { to: { ownerType, ownerId } }] },
      take: 500,
      select: { fromId: true, toId: true, relation: true },
    });
    return { nodes: items, edges: links };
  }

  /**
   * AI Context Builder — collects relevant documents, recent chats,
   * knowledge, tasks, and calendar, then builds a context bundle
   * ready to be injected before a request.
   */
  async buildContext(input: ContextBuildInput) {
    const { userId, query, workspaceId, agentId, projectId } = input;

    const owners: Array<{ ownerType: MemoryOwnerType; ownerId: string }> = [{ ownerType: "user", ownerId: userId }];
    if (workspaceId) owners.push({ ownerType: "workspace", ownerId: workspaceId });
    if (agentId) owners.push({ ownerType: "agent", ownerId: agentId });

    const memoryPromises = owners.map((o) =>
      this.recall({ ...o, query, limit: 6, minScore: 0.1 }).catch(() => []),
    );
    const [memories, knowledge, chats, tasks, events] = await Promise.all([
      Promise.all(memoryPromises).then((r) => r.flat()),
      prisma.knowledgeFile.findMany({
        where: { userId, ...(projectId ? { projectId } : {}) },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true },
      }),
      prisma.chat.findMany({
        where: { userId, ...(projectId ? { projectId } : {}) },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, updatedAt: true },
      }),
      prisma.task.findMany({
        where: { userId, status: { not: "done" } },
        orderBy: { priority: "desc" },
        take: 8,
        select: { id: true, title: true, status: true, dueDate: true },
      }),
      prisma.calendarEvent.findMany({
        where: { userId, startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 5,
        select: { id: true, title: true, startAt: true },
      }),
    ]);

    return {
      query,
      memories,
      knowledge: knowledge.map((k) => ({ id: k.id, name: k.name })),
      recentChats: chats.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })),
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, dueDate: t.dueDate })),
      upcomingEvents: events.map((e) => ({ id: e.id, title: e.title, startAt: e.startAt })),
      builtAt: new Date().toISOString(),
    };
  }
}

export const memoryService = new MemoryService();
