import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { runAi } from "./ai-assist";

export class AgentService {
  async list(userId: string) {
    return prisma.agent.findMany({
      where: { userId },
      include: { _count: { select: { runs: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async get(id: string, userId: string) {
    return prisma.agent.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: {
    name: string;
    description?: string;
    role?: string;
    icon?: string;
    color?: string;
  }) {
    return prisma.agent.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description ?? null,
        role: data.role?.trim() || "You are a helpful AI assistant.",
        icon: data.icon ?? "🤖",
        color: data.color ?? "#6366F1",
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string | null;
    role?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
  }) {
    return prisma.agent.updateMany({ where: { id, userId }, data });
  }

  async remove(id: string, userId: string) {
    return prisma.agent.deleteMany({ where: { id, userId } });
  }

  async runs(agentId: string, userId: string, limit = 20) {
    return prisma.agentRun.findMany({
      where: { agentId, userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Run a single agent — or a chain of specialized agents (multi-agent workflow).
   * Each step's output becomes the next agent's input; results are stored on the
   * AgentRun as `steps` for full visibility.
   */
  async run(agentId: string, userId: string, opts: { input: string; chain?: string[] }) {
    const chainIds = [agentId, ...(opts.chain ?? [])];
    const agents = await prisma.agent.findMany({
      where: { id: { in: chainIds }, userId, isActive: true },
    });
    if (agents.length === 0) throw new Error("Agent not found");

    const run = await prisma.agentRun.create({
      data: { agentId, userId, input: opts.input, status: "running" },
    });

    const startedAt = Date.now();
    const steps: { agentId: string; name: string; input: string; output: string }[] = [];
    let currentInput = opts.input;

    try {
      for (const id of chainIds) {
        const agent = agents.find((a) => a.id === id);
        if (!agent) continue;
        const memory = await this.buildMemory(userId, agent.id);
        const prompt = memory
          ? `${currentInput}\n\n## Memory from previous runs\n${memory}`
          : currentInput;
        const { content } = await runAi(prompt, userId, { role: agent.role });
        steps.push({ agentId: id, name: agent.name, input: currentInput, output: content });
        currentInput = content;
      }

      const output = steps[steps.length - 1].output;
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          output,
          status: "completed",
          steps: steps as Prisma.InputJsonValue,
          durationMs: Date.now() - startedAt,
        },
      });
      return this.get(run.id, userId);
    } catch (error) {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Run failed",
          durationMs: Date.now() - startedAt,
        },
      });
      throw error;
    }
  }

  /** Long-term memory: the agent's recent completed runs, surfaced as context on the next run. */
  private async buildMemory(userId: string, agentId: string, limit = 3): Promise<string> {
    const recent = await prisma.agentRun.findMany({
      where: { userId, agentId, status: "completed", output: { not: null } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { input: true, output: true },
    });
    return recent
      .map(
        (r, i) =>
          `${i + 1}. Input: ${r.input.slice(0, 300)}\n   Output: ${(r.output ?? "").slice(0, 300)}`
      )
      .join("\n\n");
  }
}

export const agentService = new AgentService();
