import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkMessageLimit } from "@/lib/ratelimit";
import { aiEngine } from "@/engine/AIEngine";
import { messageRepository } from "@/repositories/MessageRepository";
import { chatRepository } from "@/repositories/ChatRepository";
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
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const plan = subscription?.plan || "free";
  const isPro = plan === "pro" || plan === "enterprise";

  const limitCheck = await checkMessageLimit(userId, plan);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: "Rate limit exceeded",
      limit: limitCheck.limit, window: limitCheck.window, remaining: limitCheck.remaining,
    }, { status: 429 });
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { content, tone, model, platform, language, recipient, length, creativity, emojis, audience, formality } = parsed.data;

  const chat = await chatRepository.findByIdAndUser(chatId, userId);
  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await messageRepository.create({ chatId, role: "user", content, tone, platform, language });
  await chatRepository.update(chatId, userId, { updatedAt: new Date() } as any);

  const history = (chat.messages || []).map(m => ({
    id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content, createdAt: m.createdAt,
  }));

  const assistantMessage = await messageRepository.create({ chatId, role: "assistant", content: "", tone });

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
          tone: tone as any,
          platform: platform as any,
          language,
          length: length as any,
          creativity,
          formality: formality as any,
          audience,
          history,
          userId,
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

        await prisma.message.update({
          where: { id: assistantMessage.id },
          data: { content: fullContent, model: usedModel || usedProvider, tokens: totalTokens, latency: Date.now() - startTime },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", messageId: assistantMessage.id })}\n`));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        await prisma.message.update({
          where: { id: assistantMessage.id },
          data: { content: "I apologize, but I'm having trouble responding right now. Please try again in a moment." },
        }).catch(() => {});
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Failed to generate response" })}\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
