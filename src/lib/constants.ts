import { color } from "@/styles/colors";

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
  { id: "professional", label: "Professional", description: "Formal consultant tone", color: color.tone.professional, emoji: "💼" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable", color: color.tone.friendly, emoji: "😊" },
  { id: "creative", label: "Creative", description: "Imaginative storyteller", color: color.tone.creative, emoji: "🎨" },
  { id: "romantic", label: "Romantic", description: "Tender and heartfelt", color: color.tone.romantic, emoji: "❤️" },
  { id: "luxury", label: "Luxury", description: "Premium and refined", color: color.tone.luxury, emoji: "✨" },
  { id: "funny", label: "Funny", description: "Witty and lighthearted", color: color.tone.funny, emoji: "😂" },
  { id: "minimal", label: "Minimal", description: "Clean and concise", color: color.tone.minimal, emoji: "⚪" },
  { id: "corporate", label: "Corporate", description: "Executive business style", color: color.tone.corporate, emoji: "🏢" },
  { id: "academic", label: "Academic", description: "Research and evidence-based", color: color.tone.academic, emoji: "🎓" },
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
    color: color.tone.professional,
    accent: "rgba(59, 130, 246, 0.1)",
  },
  {
    icon: "Zap",
    title: "Reply Generator",
    description:
      "Generate intelligent replies for any conversation context.",
    color: color.tone.friendly,
    accent: "rgba(16, 185, 129, 0.1)",
  },
  {
    icon: "FileText",
    title: "Email Generator",
    description:
      "Craft professional emails that get responses every time.",
    color: color.tone.creative,
    accent: "rgba(168, 85, 247, 0.1)",
  },
  {
    icon: "Shield",
    title: "Grammar Fix",
    description:
      "Perfect grammar and clarity with AI-powered corrections.",
    color: color.tone.funny,
    accent: "rgba(249, 115, 22, 0.1)",
  },
  {
    icon: "Palette",
    title: "Humanizer",
    description:
      "Make AI text sound authentically human and natural.",
    color: color.tone.romantic,
    accent: "rgba(244, 63, 94, 0.1)",
  },
  {
    icon: "Globe",
    title: "Translation",
    description:
      "Translate seamlessly across 50+ languages while preserving tone.",
    color: color.tone.academic,
    accent: "rgba(20, 184, 166, 0.1)",
  },
];

export const PLATFORMS = [
  { name: "WhatsApp", icon: "MessageCircle", color: color.platform.whatsapp },
  { name: "Instagram", icon: "Camera", color: color.platform.instagram },
  { name: "Slack", icon: "Hash", color: color.platform.slack },
  { name: "Discord", icon: "MessageSquare", color: color.platform.discord },
  { name: "LinkedIn", icon: "Linkedin", color: color.platform.linkedin },
  { name: "Twitter", icon: "Twitter", color: color.platform.twitter },
  { name: "Telegram", icon: "Send", color: color.platform.telegram },
  { name: "Email", icon: "Mail", color: color.platform.email },
];

export const AI_THINKING_STATES = [
  { label: "Understanding Tone", icon: "Brain" },
  { label: "Finding Emotion", icon: "Heart" },
  { label: "Improving Grammar", icon: "CheckCircle" },
  { label: "Optimizing Platform", icon: "Monitor" },
  { label: "Generating Response", icon: "Sparkles" },
];


