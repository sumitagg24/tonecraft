export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "rewrite" | "social" | "email" | "career" | "reply" | "utility" | "dating" | "business";
  color: string;
}

export const tools: ToolDefinition[] = [
  // Rewrite
  { id: "professional-rewrite", title: "Professional Rewrite", description: "Formal, polished business writing", icon: "Briefcase", category: "rewrite", color: "#3b82f6" },
  { id: "casual-rewrite", title: "Casual Rewrite", description: "Relaxed, everyday language", icon: "MessageCircle", category: "rewrite", color: "#10b981" },
  { id: "friendly-rewrite", title: "Friendly Rewrite", description: "Warm and approachable", icon: "Smile", category: "rewrite", color: "#f59e0b" },
  { id: "formal-rewrite", title: "Formal Rewrite", description: "Official document style", icon: "FileText", category: "rewrite", color: "#6366f1" },
  { id: "luxury-rewrite", title: "Luxury Rewrite", description: "Premium, refined language", icon: "Gem", category: "rewrite", color: "#d4a853" },
  { id: "corporate-rewrite", title: "Corporate Rewrite", description: "Fortune 500 style", icon: "Building", category: "rewrite", color: "#475569" },
  { id: "genz-rewrite", title: "Gen Z Rewrite", description: "Authentic Gen Z voice", icon: "Zap", category: "rewrite", color: "#a855f7" },
  { id: "millennial-rewrite", title: "Millennial Rewrite", description: "Relatable millennial tone", icon: "Coffee", category: "rewrite", color: "#06b6d4" },
  { id: "funny-rewrite", title: "Funny Rewrite", description: "Witty and entertaining", icon: "Laugh", category: "rewrite", color: "#eab308" },
  { id: "sarcastic-rewrite", title: "Sarcastic Rewrite", description: "Dry wit and irony", icon: "SmilePlus", category: "rewrite", color: "#f97316" },
  { id: "polite-rewrite", title: "Polite Rewrite", description: "Exceptionally courteous", icon: "Heart", category: "rewrite", color: "#ec4899" },
  { id: "dating-rewrite", title: "Dating / Rizz", description: "Confident and charming", icon: "Flame", category: "dating", color: "#f43f5e" },
  { id: "romantic-rewrite", title: "Romantic / Flirty", description: "Tender and heartfelt", icon: "Heart", category: "dating", color: "#f43f5e" },
  { id: "ceo-rewrite", title: "CEO Style", description: "Visionary and commanding", icon: "Crown", category: "rewrite", color: "#7c3aed" },

  // Reply
  { id: "whatsapp-reply", title: "WhatsApp Reply", description: "Natural chat responses", icon: "MessageCircle", category: "reply", color: "#25d366" },
  { id: "instagram-reply", title: "Instagram Reply", description: "DM and comment replies", icon: "Camera", category: "reply", color: "#e4405f" },
  { id: "linkedin-reply", title: "LinkedIn Reply", description: "Professional networking", icon: "Network", category: "reply", color: "#0a66c2" },
  { id: "professional-reply", title: "Professional Reply", description: "Polished business replies", icon: "Briefcase", category: "reply", color: "#3b82f6" },
  { id: "customer-support-reply", title: "Support Reply", description: "Helpful customer responses", icon: "Headphones", category: "reply", color: "#10b981" },
  { id: "genz-reply", title: "Gen Z Reply", description: "Authentic Gen Z style", icon: "Zap", category: "reply", color: "#a855f7" },
  { id: "dating-reply", title: "Dating Reply", description: "Confident dating messages", icon: "Heart", category: "dating", color: "#f43f5e" },
  { id: "funny-reply", title: "Funny Reply", description: "Make them laugh", icon: "Laugh", category: "reply", color: "#eab308" },
  { id: "polite-reply", title: "Polite Reply", description: "Gracious and courteous", icon: "Shield", category: "reply", color: "#ec4899" },
  { id: "sarcastic-reply", title: "Sarcastic Reply", description: "Witty and clever", icon: "SmilePlus", category: "reply", color: "#f97316" },

  // Social — LinkedIn family
  { id: "linkedin-post", title: "LinkedIn Post", description: "Engaging professional content", icon: "Network", category: "social", color: "#0a66c2" },
  { id: "linkedin-hook", title: "LinkedIn Hook Generator", description: "Openers that stop the scroll", icon: "Zap", category: "social", color: "#0a66c2" },
  { id: "linkedin-carousel", title: "LinkedIn Carousel", description: "Slide-by-slide post structure", icon: "Layers", category: "social", color: "#0a66c2" },
  { id: "linkedin-thought-leadership", title: "Thought Leadership", description: "Opinion posts with authority", icon: "Crown", category: "social", color: "#0a66c2" },
  { id: "linkedin-personal-story", title: "Personal Story", description: "Authentic storytelling posts", icon: "BookOpen", category: "social", color: "#0a66c2" },
  { id: "linkedin-hiring", title: "Hiring Post", description: "Attract great candidates", icon: "Briefcase", category: "social", color: "#0a66c2" },
  { id: "linkedin-announcement", title: "Company Announcement", description: "Launches and milestones", icon: "Megaphone", category: "social", color: "#0a66c2" },

  // Social — X / Twitter family
  { id: "twitter-thread", title: "Twitter/X Thread", description: "Viral thread generator", icon: "Hash", category: "social", color: "#1da1f2" },
  { id: "twitter-hook", title: "X Hook Optimizer", description: "First line that gets reads", icon: "Zap", category: "social", color: "#1da1f2" },
  { id: "twitter-viral", title: "Viral Rewrite", description: "Rewrite for maximum reach", icon: "Flame", category: "social", color: "#1da1f2" },
  { id: "twitter-quote-reply", title: "Quote Reply", description: "Add context with a reply", icon: "MessageCircle", category: "social", color: "#1da1f2" },
  { id: "twitter-long-thread", title: "Long → Thread", description: "Split a post into a thread", icon: "AlignLeft", category: "social", color: "#1da1f2" },

  // Social — Threads family
  { id: "threads-post", title: "Threads Post", description: "Casual, conversational updates", icon: "Hash", category: "social", color: "#000000" },
  { id: "threads-casual", title: "Threads Casual Rewrite", description: "Low-key, human voice", icon: "Smile", category: "social", color: "#000000" },
  { id: "threads-storytelling", title: "Threads Storytelling", description: "Story-first engagement", icon: "BookOpen", category: "social", color: "#000000" },
  { id: "threads-engagement", title: "Threads Engagement", description: "Conversation-starting posts", icon: "MessageSquare", category: "social", color: "#000000" },

  // Social — Reddit family
  { id: "reddit-helpful", title: "Reddit Helpful", description: "Value-first community replies", icon: "MessageSquare", category: "social", color: "#ff4500" },
  { id: "reddit-community-safe", title: "Reddit Community-Safe", description: "On-tone, rule-friendly posts", icon: "Shield", category: "social", color: "#ff4500" },

  // Social — Other platforms
  { id: "instagram-caption", title: "Instagram Caption", description: "Scroll-stopping captions", icon: "Camera", category: "social", color: "#e4405f" },
  { id: "facebook-post", title: "Facebook Post", description: "Engaging community content", icon: "ThumbsUp", category: "social", color: "#1877f2" },
  { id: "youtube-description", title: "YouTube Description", description: "SEO descriptions", icon: "Video", category: "social", color: "#ff0004" },
  { id: "medium-post", title: "Medium Article", description: "Thoughtful long-form posts", icon: "FileText", category: "social", color: "#00ab6c" },
  { id: "producthunt-launch", title: "Product Hunt Launch", description: "Launch-day posts that convert", icon: "Rocket", category: "social", color: "#da552f" },
  { id: "hackernews-post", title: "Hacker News Post", description: "Technical, substantive titles", icon: "Terminal", category: "social", color: "#ff6600" },
  { id: "github-readme", title: "GitHub README", description: "Clear project documentation", icon: "FileText", category: "social", color: "#181717" },
  { id: "whatsapp-post", title: "WhatsApp Message", description: "Natural, personal messages", icon: "MessageCircle", category: "social", color: "#25d366" },
  { id: "slack-post", title: "Slack Message", description: "Concise team communication", icon: "Hash", category: "social", color: "#4a154b" },
  { id: "discord-post", title: "Discord Message", description: "Community-friendly notes", icon: "MessageSquare", category: "social", color: "#5865f2" },

  // Email
  { id: "email-writer", title: "Email Writer", description: "Professional email composition", icon: "Mail", category: "email", color: "#ea4335" },
  { id: "cold-email", title: "Cold Email", description: "Outreach that gets replies", icon: "Send", category: "email", color: "#2563eb" },
  { id: "cold-email-followup", title: "Email Follow-up", description: "Gentle, effective nudges", icon: "Send", category: "email", color: "#2563eb" },
  { id: "hr-email", title: "HR Email", description: "People operations messages", icon: "Briefcase", category: "email", color: "#7c3aed" },
  { id: "apology-email", title: "Apology Email", description: "Sincere, professional apologies", icon: "Heart", category: "email", color: "#ec4899" },
  { id: "negotiation-email", title: "Negotiation Email", description: "Firm, fair negotiation", icon: "Handshake", category: "email", color: "#f59e0b" },
  { id: "business-proposal", title: "Business Proposal", description: "Persuasive proposals", icon: "FileBarChart", category: "business", color: "#7c3aed" },
  { id: "meeting-request", title: "Meeting Request", description: "Polished invitations", icon: "Calendar", category: "business", color: "#0891b2" },

  // Career
  { id: "resume-bullet", title: "Resume Bullets", description: "Powerful achievement statements", icon: "List", category: "career", color: "#14b8a6" },
  { id: "cover-letter", title: "Cover Letter", description: "Compelling job applications", icon: "FileText", category: "career", color: "#6366f1" },
  { id: "interview-answer", title: "Interview Answer", description: "STAR method responses", icon: "Mic", category: "career", color: "#f59e0b" },

  // Utility
  { id: "grammar-fix", title: "Grammar Fix", description: "Correct errors, keep meaning", icon: "CheckCircle", category: "utility", color: "#14b8a6" },
  { id: "translate", title: "Translation", description: "Translate preserving tone", icon: "Globe", category: "utility", color: "#8b5cf6" },
  { id: "summarize", title: "Summarize", description: "Condense to key points", icon: "AlignLeft", category: "utility", color: "#06b6d4" },
  { id: "enhance", title: "Enhance", description: "Improve clarity and impact", icon: "Wand2", category: "rewrite", color: "#a855f7" },
  { id: "prompt-improver", title: "Prompt Improver", description: "Optimize AI prompts", icon: "Wand", category: "utility", color: "#a855f7" },
  { id: "simplify", title: "Simplify", description: "Make text easier to understand", icon: "Minimize", category: "utility", color: "#10b981" },
];

export const toolCategories = [
  { id: "rewrite" as const, label: "Rewrite", icon: "Edit" },
  { id: "reply" as const, label: "Reply", icon: "MessageSquare" },
  { id: "social" as const, label: "Social Media", icon: "Share2" },
  { id: "email" as const, label: "Email", icon: "Mail" },
  { id: "business" as const, label: "Business", icon: "Briefcase" },
  { id: "career" as const, label: "Career", icon: "TrendingUp" },
  { id: "dating" as const, label: "Dating", icon: "Heart" },
  { id: "utility" as const, label: "Utility", icon: "Wrench" },
];
