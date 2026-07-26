import { logger } from "@/lib/logger";

export type AnalyticsEvent = string;

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export class AnalyticsService {
  async trackEvent(
    userId: string,
    event: AnalyticsEvent,
    properties?: AnalyticsProperties,
  ): Promise<void> {
    logger.info(`[Analytics] ${event}`, { userId, ...properties });
  }
}

export const analyticsService = new AnalyticsService();
