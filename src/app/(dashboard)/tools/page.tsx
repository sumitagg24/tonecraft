"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, X, SearchX } from "lucide-react";
import { tools, toolCategories, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolPanel } from "@/components/tools/ToolPanel";
import { PageHeader } from "@/components/suite/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toolIcons } from "@/components/icons/tool-icons";
import { cn } from "@/lib/utils";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = toolIcons[name as keyof typeof toolIcons] || toolIcons.Wand;
  return <Icon className={className} />;
}

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  // Esc closes the open tool panel.
  useEffect(() => {
    if (!activeTool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTool(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTool]);

  const q = searchQuery.trim().toLowerCase();
  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    const matchesSearch =
      !q ||
      tool.title.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const countFor = (catId: string) =>
    catId === "all" ? tools.length : tools.filter((t) => t.category === catId).length;

  const resetFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="AI Writing Tools"
          description="Transform your writing with purpose-built AI tools"
          icon={<Sparkles className="h-4 w-4" />}
        />

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 pr-9"
              aria-label="Search tools"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="hidden sm:block text-xs text-muted-foreground/70 tabular-nums whitespace-nowrap">
            {filteredTools.length} of {tools.length} tools
          </span>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {[{ id: "all", label: "All Tools", icon: "Sparkles" }, ...toolCategories].map((cat) => {
            const active = activeCategory === cat.id;
            const count = countFor(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/30 hover:bg-muted/50 text-muted-foreground border-transparent"
                )}
              >
                <CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />
                {cat.label}
                <span
                  className={cn(
                    "text-[10px] tabular-nums rounded-full px-1.5 py-0.5",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted/50 text-muted-foreground/60"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTool ? (
            <ToolPanel key="panel" tool={activeTool} onClose={() => setActiveTool(null)} />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {filteredTools.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} onClick={setActiveTool} index={i} />
              ))}

              {filteredTools.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center">
                    <SearchX className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No tools found</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    {q
                      ? `Nothing matches "${searchQuery.trim()}" in ${activeCategory === "all" ? "all tools" : `the ${toolCategories.find((c) => c.id === activeCategory)?.label ?? activeCategory} category`}.`
                      : "Try a different category."}
                  </p>
                  <Button variant="outline" size="sm" className="mt-5 gap-1.5" onClick={resetFilters}>
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
