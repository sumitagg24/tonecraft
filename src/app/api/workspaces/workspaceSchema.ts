import { z } from "zod";

export const workspaceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  visibility: z.enum(["public", "private", "shared"]).optional(),
  modes: z.array(z.enum(["chat", "focus", "writer", "split", "compact", "minimal"])).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  visibility: z.enum(["public", "private", "shared"]).optional(),
  modes: z.array(z.enum(["chat", "focus", "writer", "split", "compact", "minimal"])).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const inviteCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["member", "manager", "admin"]).optional(),
  expiresAt: z.string().datetime().optional(),
  projectIds: z.array(z.string()).optional(),
});

export const memberUpdateSchema = z.object({
  role: z.enum(["member", "manager", "admin"]),
});

export const updateInviteSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected", "expired"]),
});