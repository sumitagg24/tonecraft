"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Store, Search, Award, Download, Wand2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/suite/PageHeader";

interface ListingAuthor {
  id: string;
  name: string | null;
  image: string | null;
  creatorProfile: { handle: string } | null;
}

interface Listing {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  tags: string[];
  license: string;
  priceCredits: number;
  ratingAgg: number;
  ratingCount: number;
  downloadCount: number;
  trendingScore: number;
  featured: boolean;
  createdAt: string;
  author: ListingAuthor;
}

const KINDS = ["prompt", "workflow", "persona", "template"] as const;
const KIND_LABELS: Record<string, string> = {
  prompt: "Prompts",
  workflow: "Workflows",
  persona: "Personas",
  template: "Templates",
};

export default function MarketplacePage() {
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("trending");
  const [items, setItems] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (kind !== "all") params.set("kind", kind);
      if (q.trim()) params.set("q", q.trim());
      const data = await api<{ items: Listing[] }>(`/api/marketplace/listings?${params}`);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [kind, q, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    api<Listing[]>("/api/marketplace/featured").then(setFeatured).catch(() => {});
  }, []);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <PageHeader
          title="Marketplace"
          description="Publish and discover prompts, workflows, personas, and templates."
          icon={<Store className="h-5 w-5 text-white" />}
          actions={
            <Button size="sm" variant="gradient" asChild className="gap-1.5 min-h-[36px]">
              <Link href="/marketplace/publish">
                <Plus className="h-4 w-4" />
                Publish
              </Link>
            </Button>
          }
        />

        {/* Featured row */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="group h-full border-border/40 bg-gradient-to-br from-brand/10 via-card to-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-premium rounded-xl overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant="default" className="gap-1 text-micro">
                        <Wand2 className="h-3 w-3" />
                        Featured
                      </Badge>
                      <Badge variant="secondary" className="text-micro capitalize">{item.kind}</Badge>
                    </div>
                    <h3 className="font-semibold text-base tracking-tight group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-micro text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {item.ratingCount > 0 ? item.ratingAgg.toFixed(1) : "New"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {item.downloadCount}
                      </span>
                      <span className="ml-auto font-mono">{item.priceCredits > 0 ? `${item.priceCredits} cr` : "Free"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex items-center gap-1 bg-surface border border-border/40 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setKind("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all",
                kind === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              All
            </button>
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all",
                  kind === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9 w-56 text-sm"
                placeholder="Search the marketplace…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="trending">Trending</option>
              <option value="recent">Recent</option>
              <option value="popular">Most downloaded</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        {/* Listing grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-border/40 bg-card/50 text-center py-16">
            <CardContent className="flex flex-col items-center gap-3">
              <Store className="h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Be the first to publish a {kind === "all" ? "listing" : KIND_LABELS[kind].toLowerCase()} for the community.
              </p>
              <Button size="sm" variant="outline" asChild className="mt-2">
                <Link href="/marketplace/publish">Publish something</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="group h-full border-border/40 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-premium rounded-xl">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="text-micro capitalize">{item.kind}</Badge>
                      <span className="text-micro font-mono text-muted-foreground">
                        {item.priceCredits > 0 ? `${item.priceCredits} cr` : "Free"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-muted/40 px-2 py-0.5 text-micro text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-micro text-muted-foreground border-t border-border/30 pt-3">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {item.ratingCount > 0 ? item.ratingAgg.toFixed(1) : "New"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {item.downloadCount}
                      </span>
                      <span className="ml-auto truncate">
                        {item.author.creatorProfile?.handle ?? item.author.name ?? "Creator"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
