"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Users, Files } from "lucide-react";
import { PromptLibraryPage } from "@/components/workspace/PromptLibraryPage";

type Tab = "prompts" | "personas" | "knowledge";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("prompts");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "prompts", label: "Prompts", icon: BookOpen },
    { id: "personas", label: "Personas", icon: Users },
    { id: "knowledge", label: "Knowledge", icon: Files },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 border-b border-border/20 px-4 sm:px-6 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all",
              tab === t.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {tab === t.id && (
              <motion.div layoutId="library-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {tab === "prompts" && <PromptLibraryPage />}
        {tab === "personas" && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50">
            Persona library arrives with the Personas feature.
          </div>
        )}
        {tab === "knowledge" && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground/50">
            Knowledge base arrives with the Knowledge feature.
          </div>
        )}
      </div>
    </div>
  );
}
