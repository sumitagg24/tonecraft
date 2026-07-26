export function buildGrammarPrompt(input: string): string {
  return `You are a professional proofreader and grammar expert. Correct all grammar, spelling, punctuation, and syntax errors in the following text. Preserve the original tone and meaning. Do NOT rewrite the style — only fix errors.

Text to correct:
${input}

Output only the corrected version.`;
}

export function buildSimplifyPrompt(input: string): string {
  return `You are a simplification expert. Simplify the following text to make it easier to understand. Use simpler words, shorter sentences, and clearer structure. Keep all key information.

Text to simplify:
${input}`;
}

export function buildExpandPrompt(input: string, targetLength?: string): string {
  return `You are a content expander. Expand the following text with more details, examples, and elaboration${targetLength ? ` to make it ${targetLength}` : ""}. Maintain the original tone and key message.

Text to expand:
${input}`;
}

export function buildExplainPrompt(input: string, audience?: string): string {
  return `You are an expert explainer. Explain the following like I'm ${audience || "5 years old"}. Break down complex ideas into simple, relatable concepts. Use analogies where helpful.

Text to explain:
${input}`;
}
