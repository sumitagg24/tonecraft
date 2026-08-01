import type { Tone, Formality } from "@/engine/types";

export interface EmailConfig {
  tone?: Tone;
  formality?: Formality;
  recipient?: string;
  purpose?: string;
  context?: string;
}

export function buildEmailPrompt(input: string, config: EmailConfig): string {
  const formalityGuide = config.formality === "formal"
    ? "Use formal business language. Proper salutation, structured body, professional closing."
    : config.formality === "casual"
    ? "Keep it conversational and friendly but still professional."
    : "Use a neutral professional tone. Balanced between formal and casual.";

  return `You are a professional email writer. Compose an email based on this:
"${input}"

${formalityGuide}
${config.recipient ? `\nRecipient: ${config.recipient}` : ""}
${config.purpose ? `\nPurpose: ${config.purpose}` : ""}
${config.context ? `\nContext: ${config.context}` : ""}

Structure: Subject line, appropriate greeting, clear body, professional closing.`;
}

export function buildColdEmailPrompt(input: string, config: EmailConfig): string {
  return `You are a sales outreach specialist. Write a compelling cold email:
"${input}"

Requirements:
- Clear, attention-grabbing subject line
- Personalized opening
- Value-first approach
- Social proof if relevant
- Low-friction CTA
- Under 150 words
- Professional but not robotic
${config.recipient ? `\nRecipient: ${config.recipient}` : ""}
${config.context ? `\nContext: ${config.context}` : ""}`;
}

export function buildBusinessProposalPrompt(input: string, config: EmailConfig): string {
  void config;
  return `You are a business strategy consultant. Write a professional proposal:
"${input}"

Structure:
- Executive summary
- Opportunity overview
- Proposed solution
- Timeline
- Expected outcomes
- Next steps

Use persuasive, professional language. Be specific and actionable.`;
}

export function buildMeetingRequestPrompt(input: string, config: EmailConfig): string {
  void config;
  return `You are an executive assistant. Write a meeting request:
"${input}"

Include:
- Purpose of meeting
- Proposed duration
- Suggested times/alternatives
- Brief agenda
- Preparation needed

Be respectful of recipient's time. Clear and concise.`;
}
