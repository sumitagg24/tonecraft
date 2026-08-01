import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderName } from "@/config/models";

const clients = new Map<ProviderName, ReturnType<typeof createClientForProvider>>();

function createClientForProvider(provider: ProviderName) {
  switch (provider) {
    case "groq":
      return { client: createGroq({ apiKey: process.env.GROQ_API_KEY }), envVar: "GROQ_API_KEY" };
    case "openrouter":
      return {
        client: createOpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: "https://openrouter.ai/api/v1",
        }),
        envVar: "OPENROUTER_API_KEY",
      };
    case "google":
      return { client: createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY }), envVar: "GOOGLE_AI_API_KEY" };
    case "openai":
      return { client: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }), envVar: "OPENAI_API_KEY" };
    case "anthropic":
      return { client: createOpenAI({ apiKey: process.env.ANTHROPIC_API_KEY }), envVar: "ANTHROPIC_API_KEY" };
  }
}

export function getProviderClient(provider: ProviderName) {
  let entry = clients.get(provider);
  if (!entry) {
    entry = createClientForProvider(provider);
    clients.set(provider, entry);
  }
  return entry.client;
}

export function getProviderEnvVar(provider: ProviderName): string | undefined {
  switch (provider) {
    case "groq": return process.env.GROQ_API_KEY;
    case "openrouter": return process.env.OPENROUTER_API_KEY;
    case "google": return process.env.GOOGLE_AI_API_KEY;
    case "openai": return process.env.OPENAI_API_KEY;
    case "anthropic": return process.env.ANTHROPIC_API_KEY;
  }
}

const keyLabels: Record<ProviderName, string> = {
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  google: "GOOGLE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

export function getMissingApiKeys(): string[] {
  const missing: string[] = [];
  for (const [, label] of Object.entries(keyLabels)) {
    if (!process.env[label]) missing.push(label);
  }
  return missing;
}

export function getProviderLabel(provider: ProviderName): string {
  return keyLabels[provider];
}
