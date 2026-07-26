import { type PlanConfig } from "@/config/plans";
import {
  getAllModels,
  getModelById as getModelByIdFromConfig,
  getCreditCost as getCreditCostFromConfig,
  getModelsByTier,
  getModelsByProvider as getModelsByProviderFromConfig,
  type ModelEntry,
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

  getModelsByProvider(provider: ProviderName): readonly ModelEntry[] {
    return getModelsByProviderFromConfig(provider);
  }
}

export const modelRegistry = new ModelRegistry();
