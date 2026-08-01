import type { Platform, Tone, ResponseLength } from "@/engine/types";

export interface SocialConfig {
  platform: Platform;
  tone?: Tone;
  length?: ResponseLength;
  emojiLevel?: number;
  audience?: string;
  hashtags?: boolean;
}

export function buildSocialPrompt(input: string, config: SocialConfig): string {
  switch (config.platform) {
    case "linkedin": return linkedinPost(input, config);
    case "twitter": return twitterThread(input, config);
    case "instagram": return instagramCaption(input, config);
    case "facebook": return facebookPost(input, config);
    case "threads": return threadsPost(input, config);
    case "youtube": return youtubeDescription(input, config);
    default: return genericSocial(input, config);
  }
}

function linkedinPost(input: string, config: SocialConfig): string {
  return `You are a LinkedIn content strategist. Write an engaging LinkedIn post based on this:
"${input}"

Requirements:
- Strong hook in first line
- Short paragraphs (1-2 sentences)
- Professional but approachable tone
- Relevant hashtags (3-5)
- End with question or CTA to drive engagement
${config.emojiLevel ? `- Emoji level: ${config.emojiLevel}/10` : ""}
${config.audience ? `- Target audience: ${config.audience}` : ""}`;
}

function twitterThread(input: string, config: SocialConfig): string {
  return `You are a Twitter/X content expert. Create a Twitter thread based on:
"${input}"

Requirements:
- 3-7 connected tweets
- Each tweet under 280 characters
- Number each tweet (1/n)
- Strong hook in first tweet
- Value in every tweet
- Clear CTA in final tweet
${config.emojiLevel ? `- Emoji level: ${config.emojiLevel}/10` : ""}`;
}

function instagramCaption(input: string, config: SocialConfig): string {
  return `You are an Instagram content creator. Write an Instagram caption for:
"${input}"

Requirements:
- Hook in first line
- Authentic and relatable voice
- Line breaks for readability
- 3-5 relevant hashtags
- CTA at end
${config.emojiLevel ? `- Emoji level: ${config.emojiLevel}/10` : ""}
${config.audience ? `- Target audience: ${config.audience}` : ""}`;
}

function facebookPost(input: string, config: SocialConfig): string {
  void config;
  return `You are a Facebook content creator. Write a Facebook post for:
"${input}"

Requirements:
- Engaging and shareable
- Conversational tone
- Questions to drive comments
- 2-3 relevant hashtags optional
- Personal, relatable voice`;
}

function threadsPost(input: string, config: SocialConfig): string {
  void config;
  return `You are a Threads content creator. Write a Threads post for:
"${input}"

Requirements:
- Brief and punchy (1-3 short paragraphs)
- Casual, authentic voice
- Culturally relevant
- Can include mild humor or hot takes`;
}

function youtubeDescription(input: string, config: SocialConfig): string {
  void config;
  return `You are a YouTube SEO specialist. Write a YouTube video description for:
"${input}"

Requirements:
- Summary in first 2 lines (above the fold)
- Timestamps for key sections
- Relevant links and social handles
- CTA to like/subscribe
- Natural keyword placement for SEO`;
}

function genericSocial(input: string, config: SocialConfig): string {
  return `Write an engaging social media post for ${config.platform} about:
"${input}"

Make it platform-appropriate, engaging, and shareable.${config.audience ? ` Target: ${config.audience}` : ""}`;
}
