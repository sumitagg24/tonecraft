"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONVERSATION_DATA = [
  { role: "user", content: "Hey, can we reschedule our 3pm sync to tomorrow?" },
  { role: "ai", content: "Hi! That works for me tomorrow at 3pm. I'll update the calendar invite." },
  { role: "user", content: "Also, can you update the project status for the client?" },
  { role: "ai", content: "Sure! Here's the update I sent to the client along with a polished summary for their review." },
];

export function WorkspaceShowcase() {
  const [activeTab, setActiveTab] = useState("conversations");
  const [streamedMessages, setStreamedMessages] = useState<string[]>([]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const streamMessages = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStreamedMessages([]);
    setShowPlaceholder(false);

    let msgIndex = 0;
    intervalRef.current = setInterval(() => {
      if (msgIndex < CONVERSATION_DATA.length) {
        const msg = CONVERSATION_DATA[msgIndex].content;
        msgIndex++;
        setStreamedMessages((prev) => [...prev, msg]);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 800);
  }, []);

  useEffect(() => {
    if (activeTab === "conversations" && streamedMessages.length === 0 && showPlaceholder) {
      const timer = setTimeout(streamMessages, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, streamMessages, streamedMessages.length, showPlaceholder]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const promptLibrary = [
    { title: "Formal Email", emoji: "✉️", uses: 2840 },
    { title: "Casual Reply", emoji: "💬", uses: 3420 },
    { title: "LinkedIn Post", emoji: "📢", uses: 1950 },
    { title: "Apology", emoji: "🙏", uses: 1230 },
    { title: "Thank You", emoji: "🤝", uses: 3100 },
    { title: "Follow Up", emoji: "📧", uses: 2150 },
  ];

  const tabs = [
    { id: "conversations", label: "Conversations" },
    { id: "library", label: "Prompt Library" },
    { id: "context", label: "Context Panel" },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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
            Workspace Preview
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Your AI-powered workspace
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to communicate perfectly, in one place.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel-strong rounded-2xl overflow-hidden shadow-card shine"
        >
          <div className="flex items-center gap-1 p-2 border-b border-border/40 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              <span className="text-[10px] text-muted-foreground">AI Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[420px]">
            <div className="lg:col-span-1 border-r border-border/30 p-4 hidden lg:block">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Context
              </h4>
              <div className="space-y-3">
                {[
                  { label: "Platform", value: "LinkedIn", color: "bg-green-500" },
                  { label: "Tone", value: "Professional", color: "bg-blue-500" },
                  { label: "Model", value: "GPT-4o", color: "bg-purple-500" },
                  { label: "Tokens", value: "247 / 4096", color: "bg-amber-500" },
                ].map((item) => (
                  <div key={item.label} className="workspace-panel p-3 group cursor-pointer hover:border-white/10 transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              {activeTab === "conversations" && (
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[340px]">
                  <AnimatePresence mode="popLayout">
                    {showPlaceholder ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-48 text-center"
                      >
                        <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground/60">Messages will appear here</p>
                        <button
                          onClick={streamMessages}
                          className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Start demo
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        {streamedMessages.map((msg, i) => {
                          const role = CONVERSATION_DATA[i]?.role || "user";
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                  role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted/50 text-foreground rounded-bl-md"
                                }`}
                              >
                                {msg}
                              </div>
                            </motion.div>
                          );
                        })}
                        {streamedMessages.length < CONVERSATION_DATA.length && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                          >
                            <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                              <div className="flex gap-1">
                                {[0, 1, 2].map((d) => (
                                  <motion.span
                                    key={d}
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.15 }}
                                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeTab !== "conversations" && (
                <div className="flex-1 p-4 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground/60">
                    {activeTab === "library" ? "Select a prompt from the right panel" : "Context info shown in the left sidebar"}
                  </p>
                </div>
              )}

              <div className="p-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-muted/50 border border-border/40 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <Button size="sm" className="rounded-xl px-4 gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 border-l border-border/30 p-4 hidden lg:block">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Prompt Library
              </h4>
              <div className="space-y-2">
                {promptLibrary.map((prompt) => (
                  <motion.div
                    key={prompt.title}
                    whileHover={{ x: 4 }}
                    onClick={activeTab === "conversations" ? streamMessages : undefined}
                    className="workspace-panel p-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{prompt.emoji}</span>
                      <span className="text-xs font-medium">{prompt.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {prompt.uses.toLocaleString()} uses
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
