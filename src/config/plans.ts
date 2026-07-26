export enum PlanTier {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum PlanStatus {
  ACTIVE = "active",
  TRIALING = "trialing",
  CANCELED = "canceled",
  PAST_DUE = "past_due",
  EXPIRED = "expired",
}

export interface PlanLimits {
  readonly messagesPerDay: number;
  readonly messagesPerHour: number;
  readonly maxTokensPerMessage: number;
  readonly maxFileSize: number;
  readonly maxFilesPerDay: number;
  readonly maxContextWindow: number;
  readonly maxPersonas: number;
  readonly maxStorageMB: number;
}

export interface PlanFeatures {
  readonly streaming: boolean;
  readonly customPersonas: boolean;
  readonly premiumPrompts: boolean;
  readonly fileUploads: boolean;
  readonly exportPdf: boolean;
  readonly modelSelector: boolean;
  readonly apiAccess: boolean;
  readonly teamWorkspace: boolean;
  readonly advancedAnalytics: boolean;
}

export interface PlanConfig {
  readonly tier: PlanTier;
  readonly label: string;
  readonly priceCents: number;
  readonly limits: PlanLimits;
  readonly features: PlanFeatures;
  readonly modelTier: "free" | "pro";
}

const FREE_PLAN: PlanConfig = {
  tier: PlanTier.FREE,
  label: "Free",
  priceCents: 0,
  limits: {
    messagesPerDay: 50,
    messagesPerHour: 10,
    maxTokensPerMessage: 2000,
    maxFileSize: 5 * 1024 * 1024,
    maxFilesPerDay: 5,
    maxContextWindow: 4096,
    maxPersonas: 3,
    maxStorageMB: 100,
  },
  features: {
    streaming: true,
    customPersonas: false,
    premiumPrompts: false,
    fileUploads: true,
    exportPdf: false,
    modelSelector: false,
    apiAccess: false,
    teamWorkspace: false,
    advancedAnalytics: false,
  },
  modelTier: "free",
};

const PRO_PLAN: PlanConfig = {
  tier: PlanTier.PRO,
  label: "Pro",
  priceCents: 1200,
  limits: {
    messagesPerDay: Infinity,
    messagesPerHour: 100,
    maxTokensPerMessage: 16000,
    maxFileSize: 50 * 1024 * 1024,
    maxFilesPerDay: 100,
    maxContextWindow: 16384,
    maxPersonas: 20,
    maxStorageMB: 1024,
  },
  features: {
    streaming: true,
    customPersonas: true,
    premiumPrompts: true,
    fileUploads: true,
    exportPdf: true,
    modelSelector: true,
    apiAccess: false,
    teamWorkspace: false,
    advancedAnalytics: true,
  },
  modelTier: "pro",
};

const ENTERPRISE_PLAN: PlanConfig = {
  tier: PlanTier.ENTERPRISE,
  label: "Enterprise",
  priceCents: 4900,
  limits: {
    messagesPerDay: Infinity,
    messagesPerHour: Infinity,
    maxTokensPerMessage: 32000,
    maxFileSize: 100 * 1024 * 1024,
    maxFilesPerDay: Infinity,
    maxContextWindow: 32768,
    maxPersonas: Infinity,
    maxStorageMB: 10240,
  },
  features: {
    streaming: true,
    customPersonas: true,
    premiumPrompts: true,
    fileUploads: true,
    exportPdf: true,
    modelSelector: true,
    apiAccess: true,
    teamWorkspace: true,
    advancedAnalytics: true,
  },
  modelTier: "pro",
};

const PLAN_CONFIGS: Record<PlanTier, Readonly<PlanConfig>> = {
  [PlanTier.FREE]: Object.freeze(FREE_PLAN),
  [PlanTier.PRO]: Object.freeze(PRO_PLAN),
  [PlanTier.ENTERPRISE]: Object.freeze(ENTERPRISE_PLAN),
};

export function getPlanConfig(tier: PlanTier): Readonly<PlanConfig> {
  return PLAN_CONFIGS[tier];
}

export function getDefaultPlan(): Readonly<PlanConfig> {
  return PLAN_CONFIGS[PlanTier.FREE];
}

export const PLAN_TIERS: readonly PlanTier[] = Object.values(PlanTier);
