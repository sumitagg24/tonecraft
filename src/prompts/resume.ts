import { contextBlock } from "./utils";

export function buildResumeBulletPrompt(input: string): string {
  return `You are a professional resume writer and career coach. Convert the following experience into powerful resume bullet points.

Rules:
- Use strong action verbs to start each bullet
- Quantify achievements with metrics where possible (%, $, time saved)
- Format: Action + Method + Result
- Each bullet should be 1 line
- Focus on impact, not just responsibilities
- Remove filler words

Experience to convert:
${input}

Output only the bullet points, no explanations.`;
}

export function buildCoverLetterPrompt(input: string, company?: string, role?: string): string {
  return `You are a career advisor. Write a compelling cover letter based on:
"${input}"
${company ? `\nCompany: ${company}` : ""}
${role ? `\nRole: ${role}` : ""}

Structure:
- Engaging opening naming the role
- 2-3 paragraphs highlighting relevant achievements
- Closing with enthusiasm and CTA
- Professional tone
- Under 400 words`;
}

export function buildInterviewAnswerPrompt(input: string, method?: string): string {
  return `You are an interview coach. Write a structured interview answer for:
"${input}"

Use the ${method || "STAR"} method (Situation, Task, Action, Result):
- Situation: Set the context
- Task: Describe the challenge
- Action: Explain what you did
- Result: Share the outcome with metrics

Keep it concise (1-2 minutes when spoken). Be specific and authentic.`;
}
