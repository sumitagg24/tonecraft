"use client";

export type CapabilityId =
  | "rewrite"
  | "professional-rewrite"
  | "casual-rewrite"
  | "genz-rewrite"
  | "corporate-rewrite"
  | "funny-rewrite"
  | "reply"
  | "translate"
  | "grammar"
  | "summarize"
  | "expand"
  | "shorten"
  | "email"
  | "linkedin"
  | "twitter"
  | "instagram"
  | "whatsapp"
  | "caption"
  | "custom-prompt"
  | "tweet"
  | "thread"
  | "slack"
  | "discord"
  | "facebook"
  | "millennial-rewrite"
  | "luxury-rewrite"
  | "dating-rewrite"
  | "formal-reply"
  | "friendly-reply"
  | "funny-reply"
  | "short-reply"
  | "long-reply"
  | "customer-support";

export interface Capability {
  id: CapabilityId;
  label: string;
  description: string;
  icon: string;
  category: CapabilityCategory;
  intent: string;
  defaultTone?: string;
  defaultPlatform?: string;
  searchTerms: string[];
}

export type CapabilityCategory =
  | "writing"
  | "business"
  | "social"
  | "career"
  | "email"
  | "marketing"
  | "education"
  | "customer-support"
  | "programming"
  | "translation"
  | "grammar"
  | "utilities"
  | "reply";

const registry: Record<CapabilityId, Capability> = {
  "rewrite": { id: "rewrite", label: "Rewrite", description: "Rewrite text with a different tone or style", icon: "RefreshCw", category: "writing", intent: "rewrite", searchTerms: ["rewrite", "rephrase", "reword", "change tone"] },
  "professional-rewrite": { id: "professional-rewrite", label: "Professional Rewrite", description: "Make text professional and polished", icon: "Briefcase", category: "writing", intent: "rewrite", defaultTone: "professional", searchTerms: ["professional", "formal", "business", "polished"] },
  "casual-rewrite": { id: "casual-rewrite", label: "Casual Rewrite", description: "Make text casual and conversational", icon: "MessageCircle", category: "writing", intent: "rewrite", defaultTone: "casual", searchTerms: ["casual", "informal", "chatty"] },
  "genz-rewrite": { id: "genz-rewrite", label: "Gen Z Rewrite", description: "Make text sound Gen Z authentic", icon: "Zap", category: "writing", intent: "rewrite", defaultTone: "genz", searchTerms: ["gen z", "genz", "young", "trendy", "slang"] },
  "corporate-rewrite": { id: "corporate-rewrite", label: "Corporate Rewrite", description: "Make text corporate-ready", icon: "Building2", category: "business", intent: "rewrite", defaultTone: "corporate", searchTerms: ["corporate", "executive", "business"] },
  "funny-rewrite": { id: "funny-rewrite", label: "Funny Rewrite", description: "Add humor and wit to text", icon: "Smile", category: "writing", intent: "rewrite", defaultTone: "funny", searchTerms: ["funny", "humorous", "wit", "comedy"] },
  "millennial-rewrite": { id: "millennial-rewrite", label: "Millennial Rewrite", description: "Rewrite in millennial style", icon: "Coffee", category: "writing", intent: "rewrite", defaultTone: "millennial", searchTerms: ["millennial", "millenial"] },
  "luxury-rewrite": { id: "luxury-rewrite", label: "Luxury Rewrite", description: "Make text sound premium and refined", icon: "Gem", category: "writing", intent: "rewrite", defaultTone: "luxury", searchTerms: ["luxury", "premium", "refined", "elegant"] },
  "dating-rewrite": { id: "dating-rewrite", label: "Dating Rewrite", description: "Optimize text for dating conversations", icon: "Heart", category: "writing", intent: "rewrite", defaultTone: "dating", searchTerms: ["dating", "romance", "flirt"] },
  "reply": { id: "reply", label: "Reply", description: "Generate a reply to the given message", icon: "MessageSquare", category: "reply", intent: "reply", searchTerms: ["reply", "respond", "answer"] },
  "formal-reply": { id: "formal-reply", label: "Formal Reply", description: "Generate a formal reply", icon: "FileText", category: "reply", intent: "reply", defaultTone: "formal", searchTerms: ["formal reply", "official respond"] },
  "friendly-reply": { id: "friendly-reply", label: "Friendly Reply", description: "Generate a warm friendly reply", icon: "Smile", category: "reply", intent: "reply", defaultTone: "friendly", searchTerms: ["friendly reply", "warm respond"] },
  "funny-reply": { id: "funny-reply", label: "Funny Reply", description: "Generate a witty funny reply", icon: "Laugh", category: "reply", intent: "reply", defaultTone: "funny", searchTerms: ["funny reply", "humorous respond"] },
  "short-reply": { id: "short-reply", label: "Short Reply", description: "Generate a brief concise reply", icon: "Minimize2", category: "reply", intent: "reply", searchTerms: ["short reply", "brief respond"] },
  "long-reply": { id: "long-reply", label: "Long Reply", description: "Generate a detailed long-form reply", icon: "AlignLeft", category: "reply", intent: "reply", searchTerms: ["long reply", "detailed respond"] },
  "translate": { id: "translate", label: "Translate", description: "Translate text to another language", icon: "Languages", category: "translation", intent: "translate", searchTerms: ["translate", "translation", "language"] },
  "grammar": { id: "grammar", label: "Grammar Fix", description: "Fix grammar and spelling errors", icon: "CheckSquare", category: "grammar", intent: "grammar", searchTerms: ["grammar", "spelling", "proofread", "correct"] },
  "summarize": { id: "summarize", label: "Summarize", description: "Summarize text into key points", icon: "FileText", category: "writing", intent: "summarize", searchTerms: ["summarize", "summary", "condense"] },
  "expand": { id: "expand", label: "Expand", description: "Expand text with more detail", icon: "Maximize2", category: "writing", intent: "enhance", searchTerms: ["expand", "elaborate", "detail"] },
  "shorten": { id: "shorten", label: "Shorten", description: "Condense text to be more concise", icon: "Minimize2", category: "writing", intent: "enhance", searchTerms: ["shorten", "condense", "abbreviate"] },
  "email": { id: "email", label: "Email", description: "Write a professional email", icon: "Mail", category: "email", intent: "email", defaultTone: "professional", defaultPlatform: "email", searchTerms: ["email", "draft email", "write email"] },
  "linkedin": { id: "linkedin", label: "LinkedIn", description: "Write a LinkedIn post or message", icon: "Linkedin", category: "social", intent: "social", defaultTone: "professional", defaultPlatform: "linkedin", searchTerms: ["linkedin", "post", "profile"] },
  "twitter": { id: "twitter", label: "Twitter", description: "Write a tweet or thread", icon: "Twitter", category: "social", intent: "social", defaultTone: "casual", defaultPlatform: "twitter", searchTerms: ["twitter", "tweet", "thread", "x"] },
  "instagram": { id: "instagram", label: "Instagram", description: "Write an Instagram caption or comment", icon: "Camera", category: "social", intent: "social", defaultTone: "friendly", defaultPlatform: "instagram", searchTerms: ["instagram", "caption", "comment"] },
  "whatsapp": { id: "whatsapp", label: "WhatsApp", description: "Write a WhatsApp message", icon: "MessageCircle", category: "social", intent: "social", defaultTone: "friendly", defaultPlatform: "whatsapp", searchTerms: ["whatsapp", "chat"] },
  "tweet": { id: "tweet", label: "Tweet", description: "Compose a tweet", icon: "Twitter", category: "social", intent: "social", defaultTone: "casual", defaultPlatform: "twitter", searchTerms: ["tweet", "post"] },
  "thread": { id: "thread", label: "Thread", description: "Write a Twitter thread", icon: "List", category: "social", intent: "social", defaultTone: "professional", defaultPlatform: "twitter", searchTerms: ["thread", "twitter thread"] },
  "slack": { id: "slack", label: "Slack", description: "Write a Slack message", icon: "Hash", category: "social", intent: "social", defaultTone: "casual", defaultPlatform: "slack", searchTerms: ["slack", "channel message"] },
  "discord": { id: "discord", label: "Discord", description: "Write a Discord message", icon: "MessageSquare", category: "social", intent: "social", defaultTone: "casual", defaultPlatform: "discord", searchTerms: ["discord", "server message"] },
  "facebook": { id: "facebook", label: "Facebook", description: "Write a Facebook post or comment", icon: "Facebook", category: "social", intent: "social", defaultTone: "friendly", defaultPlatform: "facebook", searchTerms: ["facebook", "post", "comment"] },
  "caption": { id: "caption", label: "Caption", description: "Write a social media caption", icon: "Image", category: "social", intent: "social", searchTerms: ["caption", "social caption"] },
  "customer-support": { id: "customer-support", label: "Customer Support", description: "Write a customer support response", icon: "Headphones", category: "customer-support", intent: "reply", defaultTone: "friendly", searchTerms: ["support", "customer", "help desk"] },
  "custom-prompt": { id: "custom-prompt", label: "Custom Prompt", description: "Use a custom prompt instruction", icon: "Terminal", category: "utilities", intent: "custom", searchTerms: ["custom", "prompt", "freeform"] },
};

export function getCapability(id: CapabilityId): Capability {
  return registry[id];
}

export function getAllCapabilities(): Capability[] {
  return Object.values(registry);
}

export function getCapabilitiesByCategory(category: CapabilityCategory): Capability[] {
  return Object.values(registry).filter((c) => c.category === category);
}

export function getCapabilityCategories(): CapabilityCategory[] {
  return Array.from(new Set(Object.values(registry).map((c) => c.category)));
}

export function searchCapabilities(query: string): Capability[] {
  const q = query.toLowerCase();
  return Object.values(registry).filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.searchTerms.some((t) => t.includes(q))
  );
}


