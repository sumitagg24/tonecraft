"use client";
import { type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { PremiumCard } from "@/components/ui/recipes";
import { toolIcons } from "@/components/icons/tool-icons";

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: (tool: ToolDefinition) => void;
  index: number;
}

export function ToolCard({ tool, onClick, index }: ToolCardProps) {
  const Icon = toolIcons[tool.icon as keyof typeof toolIcons] || toolIcons.Wand;

  return (
    <PremiumCard
      interactive
      onClick={() => onClick(tool)}
      className="group flex flex-col items-start gap-3 p-5 cursor-pointer text-left"
      style={{ transitionDelay: `${index * 0.03}s` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-semibold text-sm">{tool.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
      </div>
    </PremiumCard>
  );
}
