import { PlanTier } from "./plans";

export type FeatureKey =
  | "streaming"
  | "custom-personas"
  | "premium-prompts"
  | "file-uploads"
  | "export-pdf"
  | "model-selector"
  | "team-workspace"
  | "advanced-analytics"
  | "agents"
  | "voice"
  | "image-gen"
  | "reasoning"
  // Phase 12.8 — runtime-toggled platform features
  | "deep-research"
  | "automation"
  | "marketplace"
  // Phase 17 — memory system
  | "memory";

export interface FeatureFlag {
  key: FeatureKey;
  label: string;
  description: string;
  enabledPlans: PlanTier[];
  rolloutPercent?: number;
}

const FEATURE_FLAGS: readonly FeatureFlag[] = [
  {
    key: "streaming",
    label: "Streaming responses",
    description: "Real-time streaming of AI responses",
    enabledPlans: [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "custom-personas",
    label: "Custom personas",
    description: "Create and use custom writing personas",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "premium-prompts",
    label: "Premium prompts",
    description: "Access premium prompt templates",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "file-uploads",
    label: "File uploads",
    description: "Upload files for AI processing",
    enabledPlans: [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "export-pdf",
    label: "PDF export",
    description: "Export conversations as PDF",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "model-selector",
    label: "Model selector",
    description: "Manually choose which AI model to use",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "team-workspace",
    label: "Team workspace",
    description: "Collaborate with team members in shared workspaces",
    enabledPlans: [PlanTier.ENTERPRISE],
  },
  {
    key: "advanced-analytics",
    label: "Advanced analytics",
    description: "Detailed usage analytics and insights",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "agents",
    label: "AI agents",
    description: "Autonomous AI agents for complex workflows",
    enabledPlans: [PlanTier.ENTERPRISE],
  },
  {
    key: "voice",
    label: "Voice input/output",
    description: "Voice-based interaction with the AI",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "image-gen",
    label: "Image generation",
    description: "Generate images using AI models",
    enabledPlans: [PlanTier.ENTERPRISE],
  },
  {
    key: "reasoning",
    label: "Advanced reasoning",
    description: "Chain-of-thought and multi-step reasoning",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "deep-research",
    label: "Deep research",
    description: "Multi-step research mode with web-grounded synthesis",
    enabledPlans: [PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "automation",
    label: "Automations",
    description: "Recurring AI tasks and scheduled workflows",
    enabledPlans: [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE],
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "Community prompt/agent/persona marketplace",
    enabledPlans: [PlanTier.ENTERPRISE],
  },
  {
    key: "memory",
    label: "AI Memory",
    description: "Long-term memory, semantic recall, and the AI context builder",
    enabledPlans: [PlanTier.FREE, PlanTier.PRO, PlanTier.ENTERPRISE],
  },
];

export function getFeatureFlags(): readonly FeatureFlag[] {
  return FEATURE_FLAGS;
}

export function getFeature(key: FeatureKey): FeatureFlag | undefined {
  return FEATURE_FLAGS.find((f) => f.key === key);
}

export function getEnabledFeaturesForPlan(tier: PlanTier): FeatureKey[] {
  return FEATURE_FLAGS.filter((f) => f.enabledPlans.includes(tier)).map((f) => f.key);
}

export function isFeatureEnabledForPlan(key: FeatureKey, tier: PlanTier): boolean {
  const feature = getFeature(key);
  if (!feature) return false;
  return feature.enabledPlans.includes(tier);
}
