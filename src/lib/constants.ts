import { color } from "@/styles/colors";

export const APP_NAME = "ToneCraft";
export const APP_TAGLINE = "Write Once. Speak Perfectly. Everywhere.";
export const APP_DESCRIPTION =
  "An AI Communication Platform that helps you communicate perfectly everywhere.";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Comparison", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
];

export const TONES: { id: string; label: string; description: string; color: string; emoji: string; example: string }[] = [
  { id: "professional", label: "Professional", description: "Formal consultant tone", color: color.tone.professional, emoji: "💼", example: "I've attached the revised proposal for your review. Please let me know if you have any questions." },
  { id: "friendly", label: "Friendly", description: "Warm and approachable", color: color.tone.friendly, emoji: "😊", example: "Hey! Just sent over the updated doc — hope you're having a great day!" },
  { id: "creative", label: "Creative", description: "Imaginative storyteller", color: color.tone.creative, emoji: "🎨", example: "Picture this: a story that blooms in the reader's mind like a garden at dawn." },
  { id: "romantic", label: "Romantic", description: "Tender and heartfelt", color: color.tone.romantic, emoji: "❤️", example: "Every moment with you feels like a page from my favorite love story." },
  { id: "luxury", label: "Luxury", description: "Premium and refined", color: color.tone.luxury, emoji: "✨", example: "Indulge in an experience crafted with meticulous attention to every exquisite detail." },
  { id: "funny", label: "Funny", description: "Witty and lighthearted", color: color.tone.funny, emoji: "😂", example: "I'd tell you a joke about my diet, but you'd probably lose your appetite for it." },
  { id: "minimal", label: "Minimal", description: "Clean and concise", color: color.tone.minimal, emoji: "⚪", example: "Done is better than perfect. Ship it." },
  { id: "corporate", label: "Corporate", description: "Executive business style", color: color.tone.corporate, emoji: "🏢", example: "We are pleased to announce the successful completion of the strategic initiative, aligned with our quarterly objectives." },
  { id: "academic", label: "Academic", description: "Research and evidence-based", color: color.tone.academic, emoji: "🎓", example: "The extant literature suggests that tone modulation significantly influences perceived message credibility." },
  { id: "slang", label: "Slang", description: "Casual street talk", color: "#f59e0b", emoji: "😎", example: "Yo, just wanted to let you know — I'mma need to bounce, rain check?" },
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
      "50 AI generations per day",
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
    price: 6,
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
    price: 15,
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "32K context window",
      "Unlimited file uploads",
      "SSO & Admin controls",
      "Dedicated support",
    ],
    cta: "Get Enterprise",
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
  // Neutral default — no platform-specific format (no subject lines, etc.).
  { name: "General", icon: "Sparkles", color: "#8b8b8b" },
  { name: "WhatsApp", icon: "MessageCircle", color: color.platform.whatsapp },
  { name: "Instagram", icon: "Camera", color: color.platform.instagram },
  { name: "Slack", icon: "Hash", color: color.platform.slack },
  { name: "Discord", icon: "MessageSquare", color: color.platform.discord },
  { name: "LinkedIn", icon: "Linkedin", color: color.platform.linkedin },
  { name: "Twitter", icon: "Twitter", color: color.platform.twitter },
  { name: "Threads", icon: "AtSign", color: "#111111" },
  { name: "Reddit", icon: "MessageSquare", color: "#ff4500" },
  { name: "Medium", icon: "BookOpen", color: "#00ab6c" },
  { name: "Product Hunt", icon: "Rocket", color: "#da552f" },
  { name: "Hacker News", icon: "Terminal", color: "#ff6600" },
  { name: "Telegram", icon: "Send", color: color.platform.telegram },
  { name: "Email", icon: "Mail", color: color.platform.email },
];

export const AI_THINKING_STATES = [
  { label: "Understanding Tone", icon: "Brain" },
  { label: "Finding Emotion", icon: "Heart" },
  { label: "Improving Grammar", icon: "CheckCircle" },
  { label: "Optimizing Platform", icon: "Monitor" },
  { label: "Generating Response", icon: "Wand2" },
];


