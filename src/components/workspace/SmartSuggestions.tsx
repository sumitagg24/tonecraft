"use client";
import { motion } from "framer-motion";
import { useChatStore } from "@/stores/chat-store";
import { MotionStagger } from "@/styles/motion";
import {
  Briefcase, CheckSquare, Globe, Smile,
  MessageCircle, Zap, Gem, Laugh, Minimize2, Maximize2,
  AlignLeft, Reply,
} from "lucide-react";

interface Suggestion {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  tone?: string;
}

const suggestions: Suggestion[] = [
  { id: "s1", label: "Professional Rewrite", icon: Briefcase, prompt: "Rewrite this professionally:", tone: "professional" },
  { id: "s2", label: "Grammar Fix", icon: CheckSquare, prompt: "Fix grammar:", tone: "professional" },
  { id: "s3", label: "Translate", icon: Globe, prompt: "Translate this:", tone: "professional" },
  { id: "s4", label: "Gen Z", icon: Zap, prompt: "Rewrite this in Gen Z style:", tone: "genz" },
  { id: "s5", label: "Friendly", icon: Smile, prompt: "Rewrite this in a friendly way:", tone: "friendly" },
  { id: "s6", label: "Funny", icon: Laugh, prompt: "Make this funny:", tone: "funny" },
  { id: "s7", label: "Luxury", icon: Gem, prompt: "Make this sound luxurious:", tone: "luxury" },
  { id: "s8", label: "Summarize", icon: AlignLeft, prompt: "Summarize this:", tone: "professional" },
  { id: "s9", label: "Shorten", icon: Minimize2, prompt: "Make this shorter:", tone: "professional" },
  { id: "s10", label: "Expand", icon: Maximize2, prompt: "Expand on this:", tone: "professional" },
  { id: "s11", label: "Formal Reply", icon: Reply, prompt: "Write a formal reply to:", tone: "formal" },
  { id: "s12", label: "Casual", icon: MessageCircle, prompt: "Make this casual:", tone: "casual" },
];

const toneColors: Record<string, string> = {
  professional: "#3b82f6", friendly: "#10b981", genz: "#a855f7",
  funny: "#f97316", luxury: "#d4a853", formal: "#6366f1",
  casual: "#10b981", millennial: "#f43f5e",
};

interface SmartSuggestionsProps {
  chatId: string;
  onSend: (content: string, chatId: string) => Promise<void>;
}

export function SmartSuggestions({ chatId, onSend }: SmartSuggestionsProps) {
  const setSelectedTone = useChatStore((s) => s.setSelectedTone);

  const handleSuggestion = async (suggestion: Suggestion) => {
    if (suggestion.tone) {
      setSelectedTone(suggestion.tone);
    }
    await onSend(suggestion.prompt, chatId);
  };

  return (
    <div className="px-4 pb-1.5 pt-2 overflow-hidden">
      <motion.div
        variants={MotionStagger.Fast.container}
        initial="initial"
        animate="animate"
        className="flex flex-wrap gap-1.5"
      >
        {suggestions.map((suggestion) => (
          <motion.button
            key={suggestion.id}
            variants={MotionStagger.Fast.children}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSuggestion(suggestion)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium border border-border/20 bg-background/40 backdrop-blur-sm hover:bg-muted/30 hover:border-border/40 transition-all whitespace-nowrap"
          >
            <suggestion.icon className="w-3 h-3" style={{ color: toneColors[suggestion.tone || "professional"] || "#888" }} />
            {suggestion.label}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
