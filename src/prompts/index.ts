import type { Intent, IntentConfig } from "@/engine/types";
import { buildRewritePrompt, type RewriteConfig } from "./rewrite";
import { buildReplyPrompt } from "./reply";
import { buildSocialPrompt } from "./social";
import { buildEmailPrompt, buildColdEmailPrompt, buildBusinessProposalPrompt, buildMeetingRequestPrompt } from "./email";
import { buildGrammarPrompt, buildSimplifyPrompt, buildExpandPrompt, buildExplainPrompt } from "./grammar";
import { buildTranslationPrompt } from "./translation";
import { buildResumeBulletPrompt, buildCoverLetterPrompt, buildInterviewAnswerPrompt } from "./resume";
import { buildSummarizePrompt, buildEnhancePrompt, buildPromptImproverPrompt, buildCustomPrompt } from "./utility";

export type PromptResult = string;

export function buildPrompt(intent: Intent, input: string, config: IntentConfig): PromptResult {
  switch (intent) {
    case "rewrite":
      return buildRewritePrompt(input, config as RewriteConfig);
    case "reply":
      return buildReplyPrompt(input, {
        tone: config.tone || "friendly",
        platform: config.platform || "whatsapp",
        length: config.length,
        emojiLevel: config.emojiLevel,
        audience: config.audience,
      });
    case "social":
      return buildSocialPrompt(input, {
        platform: config.platform || "linkedin",
        tone: config.tone,
        length: config.length,
        emojiLevel: config.emojiLevel,
        audience: config.audience,
      });
    case "email":
      return buildEmailPrompt(input, {
        tone: config.tone,
        formality: config.formality,
        recipient: config.audience,
      });
    case "grammar":
      return buildGrammarPrompt(input);
    case "translate":
      return buildTranslationPrompt(input, {
        targetLanguage: config.language || "English",
        tone: config.tone,
      });
    case "resume":
      return buildResumeBulletPrompt(input);
    case "cover-letter":
      return buildCoverLetterPrompt(input, config.audience);
    case "summarize":
      return buildSummarizePrompt(input, config.length);
    case "enhance":
      return buildEnhancePrompt(input, config.tone);
    case "custom":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return buildCustomPrompt(input, config as any);
    default:
      return buildEnhancePrompt(input);
  }
}

export {
  buildRewritePrompt,
  buildReplyPrompt,
  buildSocialPrompt,
  buildEmailPrompt,
  buildColdEmailPrompt,
  buildBusinessProposalPrompt,
  buildMeetingRequestPrompt,
  buildGrammarPrompt,
  buildSimplifyPrompt,
  buildExpandPrompt,
  buildExplainPrompt,
  buildTranslationPrompt,
  buildResumeBulletPrompt,
  buildCoverLetterPrompt,
  buildInterviewAnswerPrompt,
  buildSummarizePrompt,
  buildEnhancePrompt,
  buildPromptImproverPrompt,
};
