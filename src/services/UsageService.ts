import { usageRepository } from "@/repositories/UsageRepository";

export class UsageService {
  async getUsage(userId: string) {
    return usageRepository.getUsage(userId);
  }

  async getStats(userId: string) {
    const [usage, providerBreakdown, modelBreakdown, dailyUsage] = await Promise.all([
      usageRepository.getUsage(userId),
      usageRepository.getProviderBreakdown(userId),
      usageRepository.getModelBreakdown(userId),
      usageRepository.getDailyUsage(userId),
    ]);

    return {
      total: usage ? { messages: usage.messagesSent, tokens: usage.tokensUsed } : { messages: 0, tokens: 0 },
      daily: usage ? { messages: usage.dailyMessages, tokens: usage.dailyTokens } : { messages: 0, tokens: 0 },
      monthly: usage ? { messages: usage.monthlyMessages, tokens: usage.monthlyTokens } : { messages: 0, tokens: 0 },
      providers: providerBreakdown,
      models: modelBreakdown,
      history: dailyUsage,
    };
  }
}

export const usageService = new UsageService();
