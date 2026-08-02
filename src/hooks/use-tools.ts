import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";

interface ToolResult {
  content: string;
  model: string;
  tokens: number;
  latency: number;
}

export function useTools() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeTool = useCallback(async (toolId: string, input: string, context?: Record<string, any>): Promise<ToolResult | null> => {
    setLoading(true);
    setError(null);
    try {
      return await api<ToolResult>("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, input, ...context }),
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTool, loading, error };
}
