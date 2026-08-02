import { z } from "zod";

export const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
export const EMOJI_RE = /^[\p{Emoji}\p{Emoji_Presentation}\s]{0,10}$/u;

export const projectSchema = z.object({
  name: z.string().min(1).max(80),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  emoji: z.string().refine((v) => !v || EMOJI_RE.test(v), "Emoji must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
  archived: z.boolean().optional(),
});

export const variableSchema = z.object({
  name: z.string().min(1).max(50),
  label: z.string().max(100).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).max(50).optional(),
});

export const promptSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000),
  category: z.string().max(50).optional(),
  variables: z.array(variableSchema).max(50).optional(),
  projectId: z.string().optional(),
});

export const promptUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.string().max(50).optional(),
  variables: z.array(variableSchema).max(50).optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
});

export const promptImportSchema = z.object({
  prompts: z.array(z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    content: z.string().min(1).max(10000),
    category: z.string().max(50).optional(),
    variables: z.array(variableSchema).max(50).optional(),
  })).min(1).max(500),
});

export const promptRenderSchema = z.object({
  content: z.string().min(1).max(10000),
  variables: z.record(z.string(), z.string().max(2000)).optional(),
});

export const personaSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(5000),
  icon: z.string().refine((v) => !v || EMOJI_RE.test(v), "Icon must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  isDefault: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tone: z.string().max(50).optional(),
  temperature: z.number().int().min(0).max(100).optional(),
  emojiUsage: z.enum(["none", "subtle", "moderate", "heavy"]).optional(),
  writingStyle: z.string().max(50).optional(),
  platformDefaults: z.record(z.string(), z.string()).optional(),
  projectId: z.string().nullable().optional(),
});

export const personaUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(1).max(5000).optional(),
  icon: z.string().refine((v) => !v || EMOJI_RE.test(v), "Icon must be a single emoji or empty").optional(),
  color: z.string().refine((v) => !v || HEX_COLOR.test(v), "Color must be a valid hex color").optional(),
  isDefault: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tone: z.string().max(50).optional(),
  temperature: z.number().int().min(0).max(100).optional(),
  emojiUsage: z.enum(["none", "subtle", "moderate", "heavy"]).optional(),
  writingStyle: z.string().max(50).optional(),
  platformDefaults: z.record(z.string(), z.string()).optional(),
  projectId: z.string().nullable().optional(),
});
