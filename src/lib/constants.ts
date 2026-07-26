export const APP_NAME = "ToneCraft";
export const APP_TAGLINE = "Write Once. Speak Perfectly. Everywhere.";
export const APP_DESCRIPTION =
  "An AI Communication Platform that helps you communicate perfectly everywhere.";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const TONES: { id: string; label: string; description: string; color: string; emoji: string }[] = [
  { id: "professional", label: "Professional", description: "Formal consultant tone", color: "#3b82f6", emoji: "💼" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable", color: "#10b981", emoji: "😊" },
  { id: "creative", label: "Creative", description: "Imaginative storyteller", color: "#a855f7", emoji: "🎨" },
  { id: "romantic", label: "Romantic", description: "Tender and heartfelt", color: "#f43f5e", emoji: "❤️" },
  { id: "luxury", label: "Luxury", description: "Premium and refined", color: "#d4a853", emoji: "✨" },
  { id: "funny", label: "Funny", description: "Witty and lighthearted", color: "#f97316", emoji: "😂" },
  { id: "minimal", label: "Minimal", description: "Clean and concise", color: "#e4e4e7", emoji: "⚪" },
  { id: "corporate", label: "Corporate", description: "Executive business style", color: "#6366f1", emoji: "🏢" },
  { id: "academic", label: "Academic", description: "Research and evidence-based", color: "#14b8a6", emoji: "🎓" },
];

export const FREE_TIER_LIMITS = {
  messagesPerDay: 50,
  messagesPerHour: 10,
  maxTokensPerMessage: 2000,
  maxFileSize: 5 * 1024 * 1024,
  maxFilesPerDay: 5,
  contextWindow: 4096,
} as const;

export const PRO_TIER_LIMITS = {
  messagesPerDay: Infinity,
  messagesPerHour: 100,
  maxTokensPerMessage: 16000,
  maxFileSize: 50 * 1024 * 1024,
  maxFilesPerDay: 100,
  contextWindow: 16384,
} as const;

export const AI_MODELS = {
  free: [
    { id: "groq-llama3-70b", name: "Llama 3.1 70B", provider: "groq" },
    { id: "groq-mixtral-8x7b", name: "Mixtral 8x7B", provider: "groq" },
    { id: "gemini-flash", name: "Gemini 1.5 Flash", provider: "google" },
  ],
  pro: [
    { id: "groq-llama3-70b", name: "Llama 3.1 70B", provider: "groq" },
    { id: "openrouter-claude", name: "Claude 3.5 Sonnet", provider: "openrouter" },
    { id: "openrouter-gpt4", name: "GPT-4o", provider: "openrouter" },
    { id: "gemini-pro", name: "Gemini 1.5 Pro", provider: "google" },
  ],
} as const;

export const PRICING_TIERS = [
  {
    name: "Free",
    price: 0,
    description: "For individuals getting started",
    features: [
      "50 messages per day",
      "All tone presets",
      "4K context window",
      "5 file uploads/day",
      "Basic support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: 12,
    description: "For power users and professionals",
    features: [
      "Unlimited messages",
      "All tone presets",
      "Custom personas",
      "16K context window",
      "100 file uploads/day",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 49,
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "32K context window",
      "Unlimited file uploads",
      "API access",
      "SSO & Admin controls",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export const FEATURES = [
  {
    icon: "MessageSquare",
    title: "Rewrite Messages",
    description:
      "Transform any message into the perfect tone instantly.",
    color: "#3b82f6",
    accent: "rgba(59, 130, 246, 0.1)",
  },
  {
    icon: "Zap",
    title: "Reply Generator",
    description:
      "Generate intelligent replies for any conversation context.",
    color: "#10b981",
    accent: "rgba(16, 185, 129, 0.1)",
  },
  {
    icon: "FileText",
    title: "Email Generator",
    description:
      "Craft professional emails that get responses every time.",
    color: "#a855f7",
    accent: "rgba(168, 85, 247, 0.1)",
  },
  {
    icon: "Shield",
    title: "Grammar Fix",
    description:
      "Perfect grammar and clarity with AI-powered corrections.",
    color: "#f97316",
    accent: "rgba(249, 115, 22, 0.1)",
  },
  {
    icon: "Palette",
    title: "Humanizer",
    description:
      "Make AI text sound authentically human and natural.",
    color: "#f43f5e",
    accent: "rgba(244, 63, 94, 0.1)",
  },
  {
    icon: "Globe",
    title: "Translation",
    description:
      "Translate seamlessly across 50+ languages while preserving tone.",
    color: "#14b8a6",
    accent: "rgba(20, 184, 166, 0.1)",
  },
];

export const PLATFORMS = [
  { name: "WhatsApp", icon: "MessageCircle", color: "#25D366" },
  { name: "Instagram", icon: "Camera", color: "#E4405F" },
  { name: "Slack", icon: "Hash", color: "#4A154B" },
  { name: "Discord", icon: "MessageSquare", color: "#5865F2" },
  { name: "LinkedIn", icon: "Linkedin", color: "#0A66C2" },
  { name: "Twitter", icon: "Twitter", color: "#1DA1F2" },
  { name: "Telegram", icon: "Send", color: "#0088cc" },
  { name: "Email", icon: "Mail", color: "#EA4335" },
];

export const AI_THINKING_STATES = [
  { label: "Understanding Tone", icon: "Brain" },
  { label: "Finding Emotion", icon: "Heart" },
  { label: "Improving Grammar", icon: "CheckCircle" },
  { label: "Optimizing Platform", icon: "Monitor" },
  { label: "Generating Response", icon: "Sparkles" },
];


