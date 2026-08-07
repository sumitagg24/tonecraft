import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkMessageLimit } from "@/lib/ratelimit";
import { capabilities } from "@/lib/capabilities";
import { aiEngine } from "@/engine/AIEngine";
import { messageRepository } from "@/repositories/MessageRepository";
import { chatRepository } from "@/repositories/ChatRepository";
import { knowledgeService } from "@/services/KnowledgeService";
import { flattenZodError } from "@/lib/withApiHandler";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(10000),
  tone: z.string().default("professional"),
  model: z.string().default("auto"),
  platform: z.string().optional(),
  language: z.string().optional(),
  recipient: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  creativity: z.number().min(0).max(100).optional(),
  emojis: z.boolean().optional(),
  audience: z.string().optional(),
  formality: z.enum(["casual", "neutral", "formal"]).optional(),
  personaId: z.string().nullable().optional(),
  knowledgeFileIds: z.array(z.string()).max(20).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  const plan = await capabilities.require({ userId, action: "send-message" });

  const limitCheck = await checkMessageLimit(userId, plan.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Rate limit exceeded",
          details: { limit: limitCheck.limit, window: limitCheck.window, remaining: limitCheck.remaining },
        },
      },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: flattenZodError(parsed.error) } },
      { status: 400 }
    );
  }

  const { content, tone, platform, language, length, creativity, audience, formality, personaId } = parsed.data;

  let chat = await chatRepository.findByIdAndUser(chatId, userId);
  if (!chat) {
    if (chatId.startsWith("temp-")) {
      chat = await chatRepository.create({
        userId,
        title: content.slice(0, 35) || "New Chat",
        tone,
      });
    } else {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Chat not found" } },
        { status: 404 }
      );
    }
  }
  // The server-generated chat owns its own id — never write under the temp id.
  const effectiveChatId = chat.id;

  let persona: { name?: string; systemPrompt?: string; tone?: string; writingStyle?: string; emojiUsage?: string } | undefined;
  if (personaId) {
    const p = await prisma.persona.findFirst({ where: { id: personaId, userId } });
    if (p) {
      persona = {
        name: p.name,
        systemPrompt: p.systemPrompt,
        tone: p.tone || undefined,
        writingStyle: p.writingStyle || undefined,
        emojiUsage: p.emojiUsage || undefined,
      };
    }
  }
  if (!persona) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { defaultPersonaId: true } });
    if (user?.defaultPersonaId) {
      const p = await prisma.persona.findFirst({ where: { id: user.defaultPersonaId, userId } });
      if (p) {
        persona = {
          name: p.name,
          systemPrompt: p.systemPrompt,
          tone: p.tone || undefined,
          writingStyle: p.writingStyle || undefined,
          emojiUsage: p.emojiUsage || undefined,
        };
      }
    }
  }

  await messageRepository.create({ chatId: effectiveChatId, role: "user", content, tone, platform, language });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await chatRepository.update(effectiveChatId, userId, { updatedAt: new Date() } as any);

  let knowledge: { systemBlock: string; sourceFiles: string[] } | undefined;
  const knowledgeFileIds = parsed.data.knowledgeFileIds;
  if (knowledgeFileIds?.length) {
    const chunks = await knowledgeService.retrieve(userId, content, knowledgeFileIds);
    if (chunks.length > 0) {
      const passages = chunks
        .map((c, i) => `[${i + 1}] source=${c.fileName}, chunk=${c.index}\n"${c.content}"`)
        .join("\n\n");
      knowledge = {
        systemBlock: `[Knowledge]\nBased on the user's documents, here are relevant passages:\n\n${passages}\n\nInstructions:\n- Use the passages above to answer. Cite them inline as [1], [2].\n- If the passages do not answer the question, say so — do not invent.`,
        sourceFiles: [...new Set(chunks.map((c) => c.fileId))],
      };
    }
  }

  const history = (chat.messages || []).map(m => ({
    id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content, createdAt: m.createdAt,
  }));

  const assistantMessage = await messageRepository.create({ chatId: effectiveChatId, role: "assistant", content: "", tone });

  const encoder = new TextEncoder();
  const startTime = Date.now();
  let fullContent = "";
  let usedModel = "";
  let usedProvider = "";
  let totalTokens = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = aiEngine.stream({
          intent: "rewrite",
          prompt: content,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tone: tone as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          platform: platform as any,
          language,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          length: length as any,
          creativity,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formality: formality as any,
          audience,
          history,
          persona,
          context: knowledge ? { knowledgeBlock: knowledge.systemBlock, sourceFiles: knowledge.sourceFiles } : undefined,
          userId,
          plan: plan.tier,
          signal: req.signal,
        });

        for await (const chunk of gen) {
          if (chunk.type === "token") {
            fullContent += chunk.content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content: chunk.content, messageId: assistantMessage.id })}\n`));
          } else if (chunk.type === "done") {
            usedModel = chunk.result.model;
            usedProvider = chunk.result.provider;
            totalTokens = chunk.result.tokens;
          } else if (chunk.type === "error") {
            throw new Error(chunk.message);
          }
        }

        if (knowledge) {
          await knowledgeService.linkToMessage(assistantMessage.id, knowledge.sourceFiles);
        }

        await prisma.message.update({
          where: { id: assistantMessage.id },
          data: { content: fullContent, model: usedModel || usedProvider, tokens: totalTokens, latency: Date.now() - startTime },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", messageId: assistantMessage.id })}\n`));
        controller.close();
      } catch (error) {
        const partial = fullContent.trim();
        console.error("Streaming error:", error);
        await prisma.message.update({
          where: { id: assistantMessage.id },
          data: {
            content: partial || "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
            model: usedModel || usedProvider,
            tokens: totalTokens,
            latency: Date.now() - startTime,
          },
        }).catch(() => {});
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to generate response" })}\n`));
        } catch {
          /* stream already cancelled by client */
        }
        try {
          controller.close();
        } catch {
          /* stream already cancelled by client */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
