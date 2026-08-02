export type {
  Intent, Tone, Platform, WritingStyle, ResponseLength, Formality,
  IntentConfig, EngineResult, EngineOptions, ConversationMessage,
  Workflow, WorkflowStep,
} from "@/engine/types";

// Keep backward-compatible re-exports
export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: "free" | "pro" | "enterprise";
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  tone?: string;
  model: string;
  platform?: string | null;
  language?: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  projectId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  _count?: { messages: number };
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tone?: string | null;
  tokens?: number | null;
  latency?: number | null;
  model?: string | null;
  platform?: string | null;
  language?: string | null;
  isEdited: boolean;
  editedAt: Date | null;
  feedback: "liked" | "disliked" | null;
  parentId: string | null;
  createdAt: Date;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  createdAt: Date;
}

export interface Persona {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string | null;
  color: string;
  isDefault: boolean;
  isFavorite: boolean;
  tone: string;
  temperature: number | null;
  emojiUsage: string;
  writingStyle: string;
  platformDefaults: Record<string, string> | null;
  projectId: string | null;
}

export interface Usage {
  messagesSent: number;
  tokensUsed: number;
  filesUploaded: number;
  storageUsed: number;
  dailyMessages: number;
  monthlyMessages: number;
  dailyTokens: number;
  monthlyTokens: number;
  resetDate: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  provider: string;
  model: string;
  tokens: number;
  latency: number;
  success: boolean;
  error: string | null;
  createdAt: Date;
}

export interface ToolResult {
  content: string;
  model: string;
  tokens: number;
  latency: number;
}

export interface SearchResult {
  chats: Chat[];
  messages: Pick<Message, "id" | "content" | "chatId" | "role" | "createdAt">[];
  prompts: { id: string; title: string; description: string | null; category: string; content: string }[];
  personas: { id: string; name: string; description: string | null; icon: string | null; color: string }[];
  knowledge: { id: string; name: string; fileName: string; fileType: string }[];
}

export interface UserPreferences {
  preferredLanguage: string;
  preferredTone: string;
  preferredPlatform: string;
  preferredStyle: string;
  preferredModel: string;
  creativityLevel: number;
  responseLength: string;
  autoSave: boolean;
  streamingEnabled: boolean;
  darkMode: boolean;
}
