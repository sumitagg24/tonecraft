"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Award, Download, UserPlus, UserCheck, ArrowLeft, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, apiPost } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CreatorData {
  id: string;
  handle: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  user: { id: string; name: string | null; image: string | null };
  listings: Array<{
    id: string;
    kind: string;
    title: string;
    description: string | null;
    priceCredits: number;
    ratingAgg: number;
    ratingCount: number;
    downloadCount: number;
  }>;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function CreatorProfilePage() {
  const params = useParams<{ handle: string }>();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreator = useCallback(async () => {
    setLoading(true);
    try {
      setCreator(await api<CreatorData>(`/api/marketplace/creators/${params.handle}`));
    } finally {
      setLoading(false);
    }
  }, [params.handle]);

  useEffect(() => {
    fetchCreator();
  }, [fetchCreator]);

  const handleFollow = async () => {
    if (!creator) return;
    if (creator.isFollowing) {
      await api(`/api/marketplace/creators/${creator.handle}/follow`, { method: "DELETE" });
    } else {
      await apiPost(`/api/marketplace/creators/${creator.handle}/follow`);
    }
    toast.success(creator.isFollowing ? "Unfollowed" : "Following creator");
    fetchCreator();
  };

  if (loading) {
    return <div className="p-6"><div className="mx-auto max-w-[1100px] space-y-4">
      <div className="h-32 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
      <div className="h-48 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
    </div></div>;
  }

  if (!creator) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-sm w-full text-center p-8">
          <p className="text-sm text-muted-foreground">Creator not found.</p>
          <Button size="sm" variant="outline" asChild className="mt-4">
            <Link href="/marketplace">Back to marketplace</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mx-auto max-w-[1100px] space-y-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        {/* Profile header */}
        <Card className="border-border/40 bg-card shadow-card rounded-xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand/20 via-amber-600/15 to-transparent" />
          <CardContent className="p-6 -mt-10 flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-primary/15 text-2xl font-bold text-primary">
              {(creator.user.name ?? creator.handle).slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 pt-12 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">{creator.user.name ?? creator.handle}</h1>
                <span className="text-sm text-muted-foreground font-mono">@{creator.handle}</span>
              </div>
              {creator.bio && <p className="text-sm text-muted-foreground mt-1 max-w-xl">{creator.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-micro text-muted-foreground">
                <span><strong className="text-foreground">{creator.followerCount}</strong> followers</span>
                <span><strong className="text-foreground">{creator.followingCount}</strong> following</span>
                <span><strong className="text-foreground">{creator.listings.length}</strong> listings</span>
              </div>
            </div>
            <Button size="sm" variant={creator.isFollowing ? "outline" : "gradient"} className="gap-1.5" onClick={handleFollow}>
              {creator.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {creator.isFollowing ? "Following" : "Follow"}
            </Button>
          </CardContent>
        </Card>

        {/* Listings */}
        {creator.listings.length === 0 ? (
          <Card className="border-border/40 bg-card/50 text-center py-12">
            <CardContent className="flex flex-col items-center gap-2">
              <Store className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No published listings yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {creator.listings.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.id}`}>
                <Card className="group h-full border-border/40 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-premium rounded-xl">
                  <CardContent className="p-5 space-y-3">
                    <Badge variant="secondary" className="text-micro capitalize">{item.kind}</Badge>
                    <h3 className="font-semibold text-sm tracking-tight group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-3 text-micro text-muted-foreground border-t border-border/30 pt-3">
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {item.ratingCount > 0 ? item.ratingAgg.toFixed(1) : "New"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {item.downloadCount}
                      </span>
                      <span className={cn("ml-auto font-mono")}>
                        {item.priceCredits > 0 ? `${item.priceCredits} cr` : "Free"}
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
