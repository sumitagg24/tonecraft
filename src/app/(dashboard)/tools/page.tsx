"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tools, toolCategories, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolPanel } from "@/components/tools/ToolPanel";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === "all" || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Writing Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transform your writing with purpose-built AI tools
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            All Tools
          </button>
          {toolCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
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
                <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                  No tools found for your search
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
