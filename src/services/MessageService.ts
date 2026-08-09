import { messageRepository } from "@/repositories/MessageRepository";
import { chatRepository } from "@/repositories/ChatRepository";
import { aiEngine } from "@/engine/AIEngine";
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

  /**
   * Regenerate an assistant reply. Rather than re-rewriting the assistant's own
   * previous output (which produced near-identical text and felt "broken"), it
   * re-answers the user message that preceded it, keeping the same tone and
   * platform, and updates the reply in place.
   */
  async regenerateMessage(messageId: string, userId: string) {
    const [plan, original] = await Promise.all([
      planService.getPlan(userId),
      messageRepository.findByIdAndUser(messageId, userId),
    ]);
    if (!original || original.role !== "assistant") throw new Error("Message not found or not an assistant message");

    const chat = await chatRepository.findByIdAndUser(original.chatId, userId);
    if (!chat) throw new Error("Chat not found");

    const all = chat.messages || [];
    const idx = all.findIndex((m) => m.id === original.id);
    const before = idx >= 0 ? all.slice(0, idx) : [];
    const precedingUser = [...before].reverse().find((m) => m.role === "user");

    // The prompt is the user's original message; keep history up to (but not
    // including) the message being regenerated, minus the duplicated prompt.
    const prompt = precedingUser?.content || original.content;
    const history = before
      .filter((m) => !precedingUser || m.id !== precedingUser.id)
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        createdAt: m.createdAt,
      }));

    const result = await aiEngine.generate({
      intent: "rewrite",
      prompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tone: (original.tone || "professional") as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform: original.platform as any,
      language: original.language || undefined,
      history,
      userId,
      plan: plan.tier,
    });

    const updated = await messageRepository.updateForUser(original.id, userId, {
      content: result.content,
      model: result.model,
      tokens: result.tokens,
      latency: result.latency,
    });
    if (!updated) throw new Error("Failed to update message");

    return messageRepository.findById(original.id);
  }
  // NOTE: edit/delete/feedback live in the ownership-scoped API routes
  // (MessageRepository.updateForUser/deleteForUser/updateFeedbackForUser).
  // Unscoped variants were removed — they were dead code and an IDOR trap.
}

export const messageService = new MessageService();
