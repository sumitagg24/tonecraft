"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Award, Download, ArrowLeft, Check, Share2, Trash2, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, apiPost } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ListingDetail {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  content: Record<string, unknown>;
  tags: string[];
  license: string;
  priceCredits: number;
  status: string;
  ratingAgg: number;
  ratingCount: number;
  downloadCount: number;
  trendingScore: number;
  createdAt: string;
  authorId: string;
  author: { id: string; name: string | null; image: string | null; creatorProfile: { handle: string; bio: string | null } | null };
  reviews: Array<{ id: string; rating: number; review: string | null; createdAt: string; user: { id: string; name: string | null; image: string | null } }>;
  reviewCount: number;
  downloaded: boolean;
  isFollowing: boolean;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      setListing(await api<ListingDetail>(`/api/marketplace/listings/${params.id}`));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleDownload = async () => {
    if (!listing) return;
    await apiPost(`/api/marketplace/listings/${listing.id}/download`);
    toast.success("Downloaded to your library");
    fetchListing();
  };

  const handleReview = async () => {
    if (!listing || rating === 0) return;
    await apiPost(`/api/marketplace/listings/${listing.id}/reviews`, { rating, review });
    toast.success("Review submitted");
    setRating(0);
    setReview("");
    fetchListing();
  };

  const handleShare = async () => {
    if (!listing) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (!listing) return;
    await api(`/api/marketplace/listings/${listing.id}`, { method: "DELETE" });
    toast.success("Listing deleted");
    router.push("/marketplace");
  };

  if (loading) {
    return <div className="p-6"><div className="mx-auto max-w-[1100px] space-y-4">
      <div className="h-8 w-64 bg-muted/40 rounded-lg animate-pulse" />
      <div className="h-72 rounded-xl border border-border/30 bg-card/40 animate-pulse" />
    </div></div>;
  }

  if (!listing) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="max-w-sm w-full text-center p-8">
          <p className="text-sm text-muted-foreground">This listing is unavailable.</p>
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
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/40 bg-card shadow-card rounded-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-micro capitalize">{listing.kind}</Badge>
                  {listing.priceCredits > 0 && (
                    <Badge variant="outline" className="text-micro font-mono">{listing.priceCredits} credits</Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>

                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {listing.tags.map((t) => (
                      <span key={t} className="rounded-full bg-muted/40 px-2.5 py-1 text-micro text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-border/30 bg-surface/50 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(listing.content, null, 2).slice(0, 2000)}</pre>
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <span className="text-micro text-muted-foreground">License: {listing.license}</span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShare}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="border-border/40 bg-card shadow-card rounded-xl">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-semibold">Reviews ({listing.reviewCount})</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                {listing.reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No reviews yet — be the first.</p>
                ) : (
                  listing.reviews.map((r) => (
                    <div key={r.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{r.user.name ?? "User"}</span>
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Award key={i} className={cn("h-3 w-3", i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted/40")} />
                          ))}
                        </span>
                      </div>
                      {r.review && <p className="text-xs text-muted-foreground">{r.review}</p>}
                    </div>
                  ))
                )}

                <div className="border-t border-border/30 pt-4 space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button key={i} onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1} out of 5`}>
                        <Award className={cn("h-5 w-5 transition-colors", i < rating ? "fill-amber-400 text-amber-400" : "text-muted/40 hover:text-amber-400")} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Share what you thought…"
                    rows={3}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                  <Button size="sm" disabled={rating === 0} onClick={handleReview} className="gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    Submit review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/40 bg-card shadow-card rounded-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(listing.author.creatorProfile?.handle ?? listing.author.name ?? "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/marketplace/creator/${listing.author.creatorProfile?.handle ?? listing.author.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {listing.author.creatorProfile?.handle ?? listing.author.name ?? "Creator"}
                    </Link>
                    <div className="flex items-center gap-3 text-micro text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Award className="h-3 w-3 fill-amber-400 text-amber-400" />{listing.ratingCount > 0 ? listing.ratingAgg.toFixed(1) : "New"}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{listing.downloadCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {listing.downloaded ? (
                    <Button className="w-full gap-1.5" variant="outline" disabled>
                      <Check className="h-4 w-4" />
                      Downloaded
                    </Button>
                  ) : (
                    <Button className="w-full gap-1.5" variant="gradient" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                      {listing.priceCredits > 0 ? `Get for ${listing.priceCredits} credits` : "Download free"}
                    </Button>
                  )}
                  {listing.authorId && (
                    <Button className="w-full" variant="outline" size="sm" asChild>
                      <Link href={`/marketplace/creator/${listing.author.creatorProfile?.handle ?? listing.authorId}`}>
                        View creator profile
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5 border-t border-border/30 pt-3 text-micro text-muted-foreground">
                  <div className="flex justify-between"><span>Published</span><span className="font-mono">{listing.createdAt.slice(0, 10)}</span></div>
                  <div className="flex justify-between"><span>Type</span><span className="capitalize">{listing.kind}</span></div>
                  <div className="flex justify-between"><span>Downloads</span><span>{listing.downloadCount}</span></div>
                </div>

                {listing.authorId && (
                  <div className="flex gap-2 border-t border-border/30 pt-3">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5">
                      <PenLine className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 gap-1.5" onClick={handleDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
