import { ok, withApiHandler } from "@/lib/withApiHandler";

const CURATED_PERSONAS = [
  {
    name: "Professional",
    description: "Clear, polished, business-ready writing",
    systemPrompt: "You write clearly, concisely, and professionally. Avoid slang and emojis. Use an authoritative but approachable tone.",
    icon: "💼",
    color: "#6366F1",
    tone: "professional",
    temperature: 70,
    emojiUsage: "none",
    writingStyle: "standard",
  },
  {
    name: "Friendly",
    description: "Warm, approachable, conversational",
    systemPrompt: "You write warmly and conversationally, as a close colleague would. Use contractions and a natural, friendly flow.",
    icon: "😊",
    color: "#10B981",
    tone: "friendly",
    temperature: 75,
    emojiUsage: "subtle",
    writingStyle: "casual",
  },
  {
    name: "Marketing Voice",
    description: "Persuasive, benefit-driven copy",
    systemPrompt: "You write persuasive marketing copy that highlights benefits, creates urgency, and drives action. Energetic and confident.",
    icon: "📣",
    color: "#F59E0B",
    tone: "marketing",
    temperature: 80,
    emojiUsage: "subtle",
    writingStyle: "persuasive",
  },
  {
    name: "Casual",
    description: "Laid-back, short, informal",
    systemPrompt: "You write casually and briefly, like texting a friend. Short sentences, loose grammar, no formality.",
    icon: "🙌",
    color: "#8B5CF6",
    tone: "casual",
    temperature: 80,
    emojiUsage: "moderate",
    writingStyle: "casual",
  },
  {
    name: "Academic",
    description: "Precise, formal, well-structured",
    systemPrompt: "You write formally and precisely with rigorous structure. Cite reasoning, avoid contractions, and use academic register.",
    icon: "🎓",
    color: "#0EA5E9",
    tone: "academic",
    temperature: 60,
    emojiUsage: "none",
    writingStyle: "formal",
  },
  {
    name: "Luxury",
    description: "Premium, refined, aspirational",
    systemPrompt: "You write with refined, premium language evoking exclusivity and craftsmanship. Elegant phrasing, no hype.",
    icon: "✨",
    color: "#B45309",
    tone: "luxury",
    temperature: 70,
    emojiUsage: "none",
    writingStyle: "luxury",
  },
];

const api = withApiHandler();

export const GET = api.GET(async () => {
  return ok(CURATED_PERSONAS);
});
