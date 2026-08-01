import type { EngineOptions, EngineResult, Workflow, WorkflowStep } from "./types";
import { AIEngine } from "./AIEngine";

export class WorkflowEngine {
  private aiEngine: AIEngine;

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine;
  }

  async execute(options: EngineOptions): Promise<EngineResult> {
    if (options.workflow) {
      return this.executeMultiStep(options.workflow, options);
    }
    return this.aiEngine.generate(options);
  }

  async *executeStream(options: EngineOptions): AsyncGenerator<
    { type: "token"; content: string; step?: string } | { type: "done"; result: EngineResult } | { type: "error"; message: string }
  > {
    if (options.workflow) {
      yield* this.executeMultiStepStream(options.workflow, options);
    } else {
      const result = await this.aiEngine.generate(options);
      yield { type: "done", result };
    }
  }

  private async executeMultiStep(workflow: Workflow, baseOptions: EngineOptions): Promise<EngineResult> {
    const stepResults = new Map<string, string>();
    let finalResult: EngineResult | null = null;

    for (const step of workflow.steps) {
      const stepInput = this.resolveStepInput(step, stepResults, baseOptions.prompt || "");

      const result = await this.aiEngine.generate({
        ...baseOptions,
        intent: step.intent,
        prompt: stepInput,
        ...step.config,
      });

      stepResults.set(step.id, result.content);
      finalResult = result;
    }

    if (!finalResult) throw new Error("Workflow produced no result");
    return finalResult;
  }

  private async *executeMultiStepStream(
    workflow: Workflow,
    baseOptions: EngineOptions
  ): AsyncGenerator<
    { type: "token"; content: string; step?: string } | { type: "done"; result: EngineResult } | { type: "error"; message: string }
  > {
    const stepResults = new Map<string, string>();
    let finalResult: EngineResult | null = null;

    for (const step of workflow.steps) {
      const stepInput = this.resolveStepInput(step, stepResults, baseOptions.prompt || "");

      try {
        const result = await this.aiEngine.generate({
          ...baseOptions,
          intent: step.intent,
          prompt: stepInput,
          ...step.config,
        });

        stepResults.set(step.id, result.content);
        finalResult = result;
        yield { type: "token", content: result.content, step: step.id };
      } catch (error) {
        yield { type: "error", message: `Step ${step.id} failed: ${(error as Error).message}` };
        return;
      }
    }

    if (finalResult) {
      yield { type: "done", result: finalResult };
    }
  }

  private resolveStepInput(step: WorkflowStep, stepResults: Map<string, string>, originalInput: string): string {
    if (step.prompt) return step.prompt;

    if (step.dependsOn) {
      const deps = step.dependsOn.map(id => stepResults.get(id)).filter(Boolean);
      if (deps.length > 0) return deps.join("\n\n");
    }

    return originalInput;
  }

  static predefinedWorkflows(): Record<string, Workflow> {
    return {
      "rewrite-and-grammar": {
        id: "rewrite-and-grammar",
        name: "Rewrite + Grammar Check",
        steps: [
          { id: "rewrite", intent: "rewrite" },
          { id: "grammar", intent: "grammar", dependsOn: ["rewrite"] },
        ],
      },
      "translate-and-rewrite": {
        id: "translate-and-rewrite",
        name: "Translate + Rewrite",
        steps: [
          { id: "translate", intent: "translate" },
          { id: "rewrite", intent: "rewrite", dependsOn: ["translate"] },
        ],
      },
      "email-workflow": {
        id: "email-workflow",
        name: "Write → Refine → Format Email",
        steps: [
          { id: "draft", intent: "email" },
          { id: "refine", intent: "enhance", dependsOn: ["draft"] },
          { id: "format", intent: "rewrite", config: { tone: "professional" }, dependsOn: ["refine"] },
        ],
      },
      "social-pipeline": {
        id: "social-pipeline",
        name: "Social Media Content Pipeline",
        steps: [
          { id: "hook", intent: "social", config: { tone: "friendly" } },
          { id: "polish", intent: "enhance", dependsOn: ["hook"] },
        ],
      },
    };
  }
}
