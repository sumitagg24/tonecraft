"use client";
import { motion } from "framer-motion";
import { Pin, PinOff, ArrowUpRight, Zap } from "lucide-react";
import { type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { toolIcons } from "@/components/icons/tool-icons";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: (tool: ToolDefinition) => void;
  index?: number;
  variant?: "grid" | "featured" | "row";
  pinned?: boolean;
  onTogglePin?: (tool: ToolDefinition) => void;
}

export function ToolCard({
  tool, onClick, index = 0, variant = "grid", pinned, onTogglePin,
}: ToolCardProps) {
  const Icon = toolIcons[tool.icon as keyof typeof toolIcons] || toolIcons.Wand;

  if (variant === "featured") {
    return (
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
        whileHover={{ y: -4 }}
        onClick={() => onClick(tool)}
        type="button"
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-6 text-left transition-colors duration-200 hover:border-border/80 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        style={{ transitionDelay: `${index * 0.03}s` }}
      >
        {/* soft radial tint in the tool color */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
          style={{ backgroundColor: tool.color }}
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: `${tool.color}18`, color: tool.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          {pinned !== undefined && onTogglePin && (
            <PinButton pinned={pinned} onToggle={() => onTogglePin(tool)} />
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[15px] tracking-tight">{tool.title}</h3>
            <Zap className="h-3 w-3 text-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-primary/80 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
          Open tool
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </motion.button>
    );
  }

  if (variant === "row") {
    return (
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.03 }}
        onClick={() => onClick(tool)}
        type="button"
        className="group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 text-left transition-all duration-200 hover:border-border/80 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{tool.title}</span>
          <span className="block truncate text-[11px] text-muted-foreground/70">{tool.description}</span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary" aria-hidden="true" />
      </motion.button>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.03 }}
      whileHover={{ y: -3 }}
      onClick={() => onClick(tool)}
      type="button"
      className={cn(
        "group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-4 text-left transition-colors duration-200 hover:border-border/80 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      )}
      style={{ transitionDelay: `${index * 0.02}s` }}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
        >
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </div>
        {pinned !== undefined && onTogglePin && (
          <PinButton pinned={pinned} onToggle={() => onTogglePin(tool)} />
        )}
      </div>
      <div>
        <h3 className="text-[13px] font-semibold leading-tight">{tool.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</p>
      </div>
      <span className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
    </motion.button>
  );
}

function PinButton({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={pinned ? "Unpin tool" : "Pin tool"}
      aria-pressed={pinned}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
        pinned
          ? "text-primary bg-primary/10"
          : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted/40 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
      )}
    >
      {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
    </span>
  );
}
