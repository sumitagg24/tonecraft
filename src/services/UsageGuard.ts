export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface UsageRecordInput {
  userId: string;
  modelId: string;
  credits: number;
}

export class UsageGuard {
  async check(userId: string, cost: number): Promise<UsageCheckResult> {
    void userId;
    void cost;
    return { allowed: true };
  }

  async canAfford(userId: string, cost: number): Promise<boolean> {
    void userId;
    void cost;
    return true;
  }

  async record(input: UsageRecordInput): Promise<void> {
    void input;
    return;
  }

  async resetDailyIfStale(userId: string): Promise<void> {
    void userId;
    return;
  }
}

export const usageGuard = new UsageGuard();
