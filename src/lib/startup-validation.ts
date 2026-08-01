import { getAllModels } from "@/config/models";

export function validateConfig(): string[] {
  const missing = getMissingKeys();
  const warnings: string[] = [];

  if (missing.length === 5) {
    warnings.push("No LLM API keys configured. Set at least one in .env");
  }

  const models = getAllModels();
  const deprecatedModels = models.filter((m) => m.status === "deprecated");
  if (deprecatedModels.length > 0) {
    warnings.push(`Deprecated models in config: ${deprecatedModels.map((m) => m.id).join(", ")}. These will not be used.`);
  }

  const duplicateIds = models.filter((m, i, a) => a.findIndex((x) => x.id === m.id) !== i);
  if (duplicateIds.length > 0) {
    warnings.push(`Duplicate model IDs: ${duplicateIds.map((m) => m.id).join(", ")}`);
  }

  return warnings;
}

function getMissingKeys(): string[] {
  const keys = ["GROQ_API_KEY", "OPENROUTER_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"];
  return keys.filter((k) => !process.env[k]);
}



const warnings = validateConfig();
if (warnings.length > 0) {
  console.warn("\n⚠️  Configuration Warnings:");
  warnings.forEach((w) => console.warn(`  • ${w}`));
  console.warn("");
}
