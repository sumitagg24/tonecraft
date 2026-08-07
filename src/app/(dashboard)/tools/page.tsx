"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SearchX, Flame, Clock3, Pin, Wand2 } from "lucide-react";
import { tools, toolCategories, type ToolDefinition } from "@/components/tools/ToolDefinitions";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolPanel } from "@/components/tools/ToolPanel";
import { PageHeader } from "@/components/suite/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toolIcons } from "@/components/icons/tool-icons";
import { useRecentTools, usePinnedTools } from "@/hooks/use-recent-tools";
import { cn } from "@/lib/utils";

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = toolIcons[name as keyof typeof toolIcons] || toolIcons.Wand;
  return <Icon className={className} />;
}

/** Curated editorial picks shown as large feature panels. */
const FEATURED_IDS = [
  "linkedin-post", "twitter-thread", "cold-email", "email-writer",
  "resume-bullet", "linkedin-carousel",
];

/** Popular tools surfaced in the "Trending" strip. */
const TRENDING_IDS = [
  "enhance", "grammar-fix", "summarize", "cover-letter",
  "twitter-hook", "cold-email-followup", "linkedin-hook", "translate",
];

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTool, setActiveTool] = useState<ToolDefinition | null>(null);
  const { recentTools, record } = useRecentTools();
  const { pinnedTools, toggle, isPinned } = usePinnedTools();

  // Deep-link support: /tools?tool=<id> opens that tool directly (marketing
  // mega menus and solution pages link here). Unknown ids are ignored.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("tool");
    if (!id) return;
    const tool = tools.find((t) => t.id === id);
    if (tool) {
      record(tool.id);
      setActiveTool(tool);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const featuredTools = useMemo(
    () => FEATURED_IDS.map((id) => tools.find((t) => t.id === id)).filter((t): t is ToolDefinition => Boolean(t)),
    []
  );
  const trendingTools = useMemo(
    () => TRENDING_IDS.map((id) => tools.find((t) => t.id === id)).filter((t): t is ToolDefinition => Boolean(t)),
    []
  );

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

  const openTool = (tool: ToolDefinition) => {
    record(tool.id);
    setActiveTool(tool);
  };

  const sectionHeading = (icon: React.ReactNode, title: string, hint?: string) => (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
        {icon}
        {title}
      </h2>
      {hint && <span className="text-[11px] text-muted-foreground/50">{hint}</span>}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-8 pb-8">
        <PageHeader
          title="AI Capability Hub"
          description="Transform your writing with purpose-built AI tools — featured, trending and pinned for fast access"
          icon={<Wand2 className="h-4 w-4" />}
        />

        {/* Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        {/* Category navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {[{ id: "all", label: "All Tools", icon: "Wand2" }, ...toolCategories].map((cat) => {
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
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Recently used */}
              {recentTools.length > 0 && !q && activeCategory === "all" && (
                <section className="space-y-3">
                  {sectionHeading(
                    <Clock3 className="h-4 w-4 text-primary/70" aria-hidden="true" />,
                    "Recently used"
                  )}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {recentTools.slice(0, 4).map((tool, i) => (
                      <ToolCard key={tool.id} tool={tool} onClick={openTool} index={i} variant="row" />
                    ))}
                  </div>
                </section>
              )}

              {/* Pinned tools */}
              {pinnedTools.length > 0 && !q && activeCategory === "all" && (
                <section className="space-y-3">
                  {sectionHeading(
                    <Pin className="h-4 w-4 text-amber-500/80" aria-hidden="true" />,
                    "Pinned tools"
                  )}
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {pinnedTools.map((tool, i) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onClick={openTool}
                        index={i}
                        variant="row"
                        pinned={isPinned(tool.id)}
                        onTogglePin={(t) => toggle(t.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Featured — large editorial panels */}
              {!q && activeCategory === "all" && (
                <section className="space-y-3">
                  {sectionHeading(
                    <Wand2 className="h-4 w-4 text-brand/80" aria-hidden="true" />,
                    "Featured tools"
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {featuredTools.map((tool, i) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onClick={openTool}
                        index={i}
                        variant="featured"
                        pinned={isPinned(tool.id)}
                        onTogglePin={(t) => toggle(t.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Trending */}
              {!q && activeCategory === "all" && (
                <section className="space-y-3">
                  {sectionHeading(
                    <Flame className="h-4 w-4 text-orange-500/80" aria-hidden="true" />,
                    "Trending this week"
                  )}
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {trendingTools.map((tool, i) => (
                      <ToolCard key={tool.id} tool={tool} onClick={openTool} index={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* All tools (filtered) */}
              <section className="space-y-3">
                {sectionHeading(
                  <CategoryIcon name={toolCategories.find((c) => c.id === activeCategory)?.icon ?? "Wand2"} className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />,
                  q
                    ? `Results for "${searchQuery.trim()}"`
                    : activeCategory === "all"
                      ? "All tools"
                      : toolCategories.find((c) => c.id === activeCategory)?.label ?? "Tools",
                  `${countFor(activeCategory)} available`
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredTools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onClick={openTool}
                      index={i}
                      pinned={isPinned(tool.id)}
                      onTogglePin={(t) => toggle(t.id)}
                    />
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
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
