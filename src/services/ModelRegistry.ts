import { type PlanConfig } from "@/config/plans";
import {
  getAllModels,
  getModelById as getModelByIdFromConfig,
  getCreditCost as getCreditCostFromConfig,
  getModelsByTier,
  getModelsByProvider as getModelsByProviderFromConfig,
  getAvailableModels as getAvailableModelsFromConfig,
  getFallbackModels as getFallbackModelsFromConfig,
  getModelsByCapability as getModelsByCapabilityFromConfig,
  markModelUnavailable,
  isModelAvailable,
  type ModelEntry,
  type ModelCapabilities,
  type ProviderName,
} from "@/config/models";

export class ModelRegistry {
  resolve(plan: Readonly<PlanConfig>, modelId?: string): readonly ModelEntry[] {
    const models = getModelsByTier(plan.tier);
    if (modelId) {
      return models.filter((m) => m.id === modelId);
    }
    return models;
  }

  getModelById(id: string): ModelEntry | undefined {
    return getModelByIdFromConfig(id);
  }

  getCreditCost(modelId: string): number | undefined {
    return getCreditCostFromConfig(modelId);
  }

  getAllModels(): readonly ModelEntry[] {
    return getAllModels();
  }

  getAvailableModels(): readonly ModelEntry[] {
    return getAvailableModelsFromConfig();
  }

  getModelsByProvider(provider: ProviderName): readonly ModelEntry[] {
    return getModelsByProviderFromConfig(provider);
  }

  getModelsByCapability(capability: keyof ModelCapabilities): readonly ModelEntry[] {
    return getModelsByCapabilityFromConfig(capability);
  }

  getFallbackModels(): readonly ModelEntry[] {
    return getFallbackModelsFromConfig();
  }

  markDecommissioned(modelId: string): void {
    markModelUnavailable(modelId);
  }

  isAvailable(modelId: string): boolean {
    return isModelAvailable(modelId);
  }

  resolveFallbackChain(plan: Readonly<PlanConfig>, excludeModelId?: string): readonly ModelEntry[] {
    let models = getModelsByTier(plan.tier)
      .filter((m) => m.id !== excludeModelId)
      .sort((a, b) => b.priority - a.priority);

    if (models.length === 0) {
      models = getFallbackModelsFromConfig().filter((m) => m.id !== excludeModelId);
    }

    return models;
  }
}

export const modelRegistry = new ModelRegistry();
