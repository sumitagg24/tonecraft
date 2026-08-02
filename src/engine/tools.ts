import type { ModelCapabilities } from "@/config/models";

/**
 * Tool-calling protocol (Phase 8.15 — A7 prep).
 *
 * This is the typed contract for AI-invoked tools, designed as the MCP/agents
 * onboarding point. Today `ToolService` executes tools via prompt-based
 * generation; this protocol lets tools be passed to the model directly
 * (`streamText` `tools` option) once a tool is marked ready in its capabilities.
 *
 * A tool's `inputSchema` follows JSON Schema — the AI SDK accepts it directly
 * (via `jsonSchema`), so no conversion layer is needed here.
 */

export interface ToolInputSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

export interface AITool {
  /** Stable identifier used in tool calls (snake_case). */
  name: string;
  /** Human-readable description the model uses to decide invocation. */
  description: string;
  /** JSON Schema for the `input` argument. */
  inputSchema: ToolInputSchema;
  /**
   * Executes the tool. Return a string; for structured results return JSON text
   * and let the model parse it (simple, provider-agnostic).
   */
  handler: (input: Record<string, unknown>) => Promise<string>;
}

/**
 * Typed registry — the single place tools are declared so routing, the API
 * layer, and future MCP adapters share one source of truth.
 */
export class ToolRegistry {
  private tools = new Map<string, AITool>();

  register(tool: AITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  list(): AITool[] {
    return [...this.tools.values()];
  }

  /** Tools the model can actually invoke, filtered by declared capability. */
  usableFor(capabilities: Pick<ModelCapabilities, "tools">): AITool[] {
    if (!capabilities.tools) return [];
    return this.list();
  }
}

export const toolRegistry = new ToolRegistry();
