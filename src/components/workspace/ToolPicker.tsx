"use client";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { tools, toolCategories, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { cn } from "@/lib/utils";
import { PickerSurface } from "./PickerSurface";
import { toolIcons } from "@/components/icons/tool-icons";
import { useRecentTools } from "@/hooks/use-recent-tools";

interface ToolPickerProps {
  onSelect: (tool: ToolDefinition) => void;
  onClose: () => void;
  loading?: boolean;
}

export function ToolPicker({ onSelect, onClose, loading }: ToolPickerProps) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const { recentTools, record } = useRecentTools();

  const filtered = tools.filter((tool) => {
    const matchesCategory = category === "all" || tool.category === category;
    const q = query.toLowerCase();
    const matchesQuery = !q || tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <PickerSurface label="Tools" onClose={onClose} className="w-[320px] bottom-full left-0 mb-1.5">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools..."
          className="w-full h-8 bg-muted/30 border border-border/30 rounded-lg pl-7 pr-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          aria-label="Search tools"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1.5">
        <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
          All
        </CategoryChip>
        {toolCategories.map((cat) => (
          <CategoryChip key={cat.id} active={category === cat.id} onClick={() => setCategory(cat.id)}>
            {cat.label}
          </CategoryChip>
        ))}
      </div>

      {recentTools.length > 0 && (
        <div className="mb-2">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Recently used
          </p>
          <div className="flex flex-wrap gap-1 px-1">
            {recentTools.slice(0, 4).map((tool) => {
              const Icon = toolIcons[tool.icon as keyof typeof toolIcons] || toolIcons.Wand;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    record(tool.id);
                    onSelect(tool);
                  }}
                  disabled={loading}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 h-7 rounded-full text-micro font-medium bg-muted/30 border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  title={tool.title}
                >
                  <span className="w-4 h-4 rounded flex items-center justify-center" style={{ color: tool.color }}>
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="max-w-[110px] truncate">{tool.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto scrollbar-thin mt-0.5">
        {filtered.map((tool) => {
          const Icon = toolIcons[tool.icon as keyof typeof toolIcons] || toolIcons.Wand;
          return (
            <button
              key={tool.id}
              onClick={() => {
                record(tool.id);
                onSelect(tool);
              }}
              disabled={loading}
              className="flex w-full items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-muted/30 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span
                className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${tool.color}22`, color: tool.color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium truncate">{tool.title}</span>
                <span className="block text-micro text-muted-foreground/60 truncate">{tool.description}</span>
              </span>
              {loading && <Loader2 className="w-3 h-3 text-muted-foreground/50 animate-spin shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-tiny text-muted-foreground/50">No tools match</p>
        )}
      </div>
    </PickerSurface>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-2.5 h-6 rounded-full text-micro font-medium transition-all",
        active ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
