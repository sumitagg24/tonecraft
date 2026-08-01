import { messageRepository } from "@/repositories/MessageRepository";
import { chatRepository } from "@/repositories/ChatRepository";
import { aiEngine } from "@/engine/AIEngine";
import { prisma } from "@/lib/prisma";
import { planService } from "@/services/PlanService";

export class MessageService {
  async getMessages(chatId: string, limit = 50, offset = 0) {
    return messageRepository.findByChatId(chatId, limit, offset);
  }

  async sendMessage(chatId: string, userId: string, data: {
    content: string; tone?: string; model?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: Record<string, any>;
  }) {
    const [plan, chat] = await Promise.all([
      planService.getPlan(userId),
      chatRepository.findByIdAndUser(chatId, userId),
    ]);
    if (!chat) throw new Error("Chat not found");

    await messageRepository.create({
      chatId, role: "user", content: data.content,
      tone: data.tone || chat.tone,
      platform: data.context?.platform || chat.platform || undefined,
      language: data.context?.language || chat.language || undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await chatRepository.update(chatId, userId, { updatedAt: new Date() } as any);

    const history = (chat.messages || []).map(m => ({
      id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content, createdAt: m.createdAt,
    }));
    history.push({ id: `pending-${Date.now()}`, role: "user" as const, content: data.content, createdAt: new Date() });

    const assistantMessage = await messageRepository.create({
      chatId, role: "assistant", content: "",
      tone: data.tone || chat.tone,
    });

    const stream = aiEngine.stream({
      intent: "rewrite",
      prompt: data.content,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: (data.tone || chat.tone) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform: data.context?.platform as any,
      language: data.context?.language,
      length: data.context?.length,
      creativity: data.context?.creativity,
      history: history.slice(0, -1),
      userId,
      plan: plan.tier,
    });

    return { stream, assistantMessage };
  }

  async regenerateMessage(messageId: string, userId: string) {
    const [plan, original] = await Promise.all([
      planService.getPlan(userId),
      messageRepository.findById(messageId),
    ]);
    if (!original || original.role !== "assistant") throw new Error("Message not found or not an assistant message");

    const chat = await chatRepository.findByIdAndUser(original.chatId, userId);
    if (!chat) throw new Error("Chat not found");

    const history = (chat.messages || [])
      .filter(m => m.id !== messageId || m.role === "user")
      .slice(0, -1)
      .map(m => ({ id: m.id, role: m.role as "user" | "assistant" | "system", content: m.content, createdAt: m.createdAt }));

    const result = await aiEngine.generate({
      intent: "rewrite",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: (original.tone || "professional") as any,
      history,
      prompt: original.content,
      userId,
      plan: plan.tier,
    });

    const regenerated = await messageRepository.regenerate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...original, content: result.content, model: result.model, tokens: result.tokens, latency: result.latency } as any,
      result.content,
      result.model,
      result.tokens,
      result.latency
    );
    return regenerated;
  }

  async continueMessage(messageId: string, userId: string) {
    const [plan, original] = await Promise.all([
      planService.getPlan(userId),
      messageRepository.findById(messageId),
    ]);
    if (!original) throw new Error("Message not found");

    const result = await aiEngine.generate({
      intent: "enhance",
      prompt: `Continue the following:\n\n${original.content}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: (original.tone || "professional") as any,
      userId,
      plan: plan.tier,
    });

    return messageRepository.create({
      chatId: original.chatId,
      role: "assistant",
      content: result.content,
      tone: original.tone || undefined,
      model: result.model,
      tokens: result.tokens,
      latency: result.latency,
    });
  }

  async editMessage(messageId: string, newContent: string) {
    return messageRepository.update(messageId, { content: newContent, isEdited: true, editedAt: new Date() });
  }

  async setFeedback(messageId: string, fb: "liked" | "disliked" | null) {
    return messageRepository.updateFeedback(messageId, fb);
  }

  async deleteMessage(messageId: string) {
    return prisma.message.delete({ where: { id: messageId } }).then(() => true);
  }
}

export const messageService = new MessageService();
