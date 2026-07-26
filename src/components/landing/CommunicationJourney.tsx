"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mail, Send, Globe, Hash } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/social-icons";
import { cn } from "@/lib/utils";

const INPUT_MESSAGE = "Hey, can we reschedule our 3pm meeting to tomorrow?";

const PLATFORMS = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    color: "#EA4335",
    output: "Dear [Name],\n\nI hope this message finds you well. I'd like to kindly request to reschedule our 3pm meeting to tomorrow at a time that works for you. Please let me know your availability.\n\nBest regards",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: LinkedinIcon,
    color: "#0A66C2",
    output: "Hi [Name], I appreciate you setting up time to connect. Would it be possible to move our 3pm discussion to tomorrow? I want to ensure I give it the attention it deserves. Let me know what works.",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: MessageSquare,
    color: "#E4405F",
    output: "Heyy! So sorry but can we push our 3pm to tomorrow instead? 🙏 Something came up but I really wanna catch up! Let me know when you're free! ✨",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: Send,
    color: "#25D366",
    output: "Hey! Can we move our 3pm to tomorrow? Got a conflict. Let me know what time works for you 👍",
  },
  {
    id: "slack",
    label: "Slack",
    icon: Hash,
    color: "#4A154B",
    output: "Quick question — any chance we could push our 3pm sync to tomorrow? Got something overlapping. Happy to grab any time that works for you.",
  },
  {
    id: "translation",
    label: "Spanish",
    icon: Globe,
    color: "#14b8a6",
    output: "Hola, ¿podemos reprogramar nuestra reunión de las 3pm para mañana? Avísame qué hora te funciona. ¡Gracias!",
  },
];

export function CommunicationJourney() {
  const [activePlatform, setActivePlatform] = useState("email");
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const current = PLATFORMS.find((p) => p.id === activePlatform)!;
  const Icon = current.icon;

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Communication Journey
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            One message, every platform
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Write once. ToneCraft adapts your message for every platform&apos;s unique language and conventions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="sticky top-28"
            >
              <div className="glass-panel-strong rounded-2xl p-6 mb-6">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Original Message
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-foreground/80 italic">&ldquo;{INPUT_MESSAGE}&rdquo;</p>
                </div>
              </div>

              <div className="space-y-2">
                {PLATFORMS.map((platform, i) => {
                  const PlatformIcon = platform.icon;
                  const isActive = activePlatform === platform.id;
                  const isHovered = hoveredPlatform === platform.id;

                  return (
                    <motion.button
                      key={platform.id}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      onClick={() => setActivePlatform(platform.id)}
                      onMouseEnter={() => setHoveredPlatform(platform.id)}
                      onMouseLeave={() => setHoveredPlatform(null)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-left",
                        isActive
                          ? "glass-panel-strong border-primary/30"
                          : "glass-panel hover:border-white/20"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                        style={{
                          backgroundColor: `${platform.color}20`,
                          transform: isHovered || isActive ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        <PlatformIcon className="w-4 h-4" style={{ color: platform.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium text-foreground truncate">{platform.label}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">
                          {platform.output.split("\n")[0].slice(0, 40)}...
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${current.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: current.color }} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{current.label}</span>
                  <span className="text-xs text-muted-foreground block">Platform-adapted output</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlatform}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel-strong rounded-2xl p-6 min-h-[300px]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: current.color }} />
                    <span className="text-xs font-medium text-muted-foreground">{current.label} tone</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {current.output}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5" />
                ToneCraft adapts punctuation, formality, length, and emoji usage per platform
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
