import { promptRepository } from "@/repositories/PromptRepository";

export interface PromptVariable {
  name: string;
  label?: string;
  required?: boolean;
  options?: string[];
}

export class PromptService {
  async listPrompts(userId: string, projectId?: string) {
    return promptRepository.findByUserId(userId, false, projectId);
  }

  async getPrompt(id: string, userId: string) {
    return promptRepository.findByIdAndUser(id, userId);
  }

  async createPrompt(userId: string, data: {
    title: string; description?: string; content: string;
    category?: string; variables?: PromptVariable[]; projectId?: string;
  }) {
    return promptRepository.create({ userId, ...data });
  }

  async updatePrompt(id: string, userId: string, data: Partial<{
    title: string; description: string; content: string; category: string;
    variables: PromptVariable[]; isFavorite: boolean; isArchived: boolean; projectId: string | null;
  }>): Promise<boolean> {
    return promptRepository.update(id, userId, data);
  }

  async deletePrompt(id: string, userId: string): Promise<boolean> {
    return promptRepository.delete(id, userId);
  }

  async listCategories(userId: string): Promise<string[]> {
    return promptRepository.listCategories(userId);
  }

  /**
   * Render a template by replacing {{variable}} tokens.
   * Unknown tokens are left as-is (so templates render even with a subset of variables).
   */
  renderTemplate(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) =>
      variables[name]?.trim() ?? `{{${name}}}`
    );
  }

  extractVariables(content: string): string[] {
    const names = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) names.add(m[1]);
    return [...names];
  }
}

export const promptService = new PromptService();
