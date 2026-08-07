import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { ListingKind, ListingStatus, Prisma } from "@prisma/client";

export type MarketplaceListParams = {
  kind?: ListingKind;
  q?: string;
  sort?: "trending" | "recent" | "popular" | "rating";
  tag?: string;
  authorId?: string;
  status?: ListingStatus;
  page?: number;
  perPage?: number;
};

export interface PublishListingInput {
  kind: ListingKind;
  title: string;
  description?: string | null;
  content: Record<string, unknown>;
  tags?: string[];
  license?: string;
  priceCredits?: number;
  status?: ListingStatus;
}

const SORTS: Record<string, Prisma.MarketplaceListingOrderByWithRelationInput | Prisma.MarketplaceListingOrderByWithRelationInput[]> = {
  trending: { trendingScore: "desc" },
  recent: { createdAt: "desc" },
  popular: { downloadCount: "desc" },
  rating: [{ ratingAgg: "desc" }, { ratingCount: "desc" }],
};

/** Recompute trending score — downloads + recency + rating velocity. */
export function computeTrendingScore(
  downloadCount: number,
  ratingAgg: number,
  ratingCount: number,
  ageDays: number,
): number {
  const downloads = Math.min(downloadCount, 1000) / 100; // 0–10
  const rating = ratingCount > 0 ? (ratingAgg / 5) * 5 : 0; // 0–5
  const recency = Math.max(0, 1 - ageDays / 90); // 1 → 0 over 90 days
  return Number((downloads * 1.2 + rating * 1.6 + recency * 2).toFixed(4));
}

/** Merge a new rating into the stored aggregate (ratingAgg is the mean). */
export function mergeRatingAgg(oldAgg: number, oldCount: number, newRating: number): { agg: number; count: number } {
  const count = oldCount + 1;
  const agg = Number(((oldAgg * oldCount + newRating) / count).toFixed(3));
  return { agg, count };
}

export class MarketplaceService {
  /** List published listings with filtering + sorting + pagination. */
  async list(params: MarketplaceListParams) {
    const {
      kind, q, sort = "trending", tag, authorId,
      status = "published", page = 1, perPage = 24,
    } = params;

    const where: Prisma.MarketplaceListingWhereInput = { status };
    if (kind) where.kind = kind;
    if (authorId) where.authorId = authorId;
    if (tag) where.tags = { has: tag };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        orderBy: SORTS[sort] ?? SORTS.trending,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          author: { select: { id: true, name: true, image: true, creatorProfile: { select: { handle: true } } } },
        },
      }),
      prisma.marketplaceListing.count({ where }),
    ]);

    return { items, total, page, perPage };
  }

  async getById(id: string, viewerId?: string) {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, creatorProfile: { select: { handle: true, bio: true } } },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!listing) return null;
    if (listing.status !== "published" && listing.authorId !== viewerId) return null;

    const [reviewCount, downloaded, isFollowing] = await Promise.all([
      prisma.listingReview.count({ where: { listingId: id } }),
      viewerId
        ? prisma.listingDownload.findUnique({ where: { listingId_userId: { listingId: id, userId: viewerId } } })
        : null,
      viewerId
        ? prisma.creatorFollow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: listing.authorId } },
          })
        : null,
    ]);

    return {
      ...listing,
      reviewCount,
      downloaded: Boolean(downloaded),
      isFollowing: Boolean(isFollowing),
    };
  }

  async create(userId: string, input: PublishListingInput) {
    const listing = await prisma.marketplaceListing.create({
      data: {
        kind: input.kind,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        content: input.content as Prisma.InputJsonValue,
        tags: input.tags ?? [],
        license: input.license ?? "cc-by-4.0",
        priceCredits: input.priceCredits ?? 0,
        status: input.status ?? "draft",
        authorId: userId,
      },
    });

    // First listing auto-creates a creator profile (handle from userId prefix).
    await prisma.creatorProfile.upsert({
      where: { userId },
      create: { userId, handle: `creator_${userId.slice(0, 8)}` },
      update: {},
    });

    return listing;
  }

  async update(userId: string, id: string, input: Partial<Omit<PublishListingInput, "kind">>) {
    const existing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!existing || existing.authorId !== userId) return null;

    const data: Prisma.MarketplaceListingUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.content !== undefined) data.content = input.content as Prisma.InputJsonValue;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.license !== undefined) data.license = input.license;
    if (input.priceCredits !== undefined) data.priceCredits = input.priceCredits;
    if (input.status !== undefined) data.status = input.status;

    return prisma.marketplaceListing.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const existing = await prisma.marketplaceListing.findUnique({ where: { id } });
    if (!existing || existing.authorId !== userId) return false;
    await prisma.marketplaceListing.delete({ where: { id } });
    return true;
  }

  /** Add/update a review; recompute the listing's rating aggregate + trending. */
  async review(listingId: string, userId: string, rating: number, review?: string) {
    if (rating < 1 || rating > 5) return null;
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "published") return null;
    if (listing.authorId === userId) return null; // authors can't review their own work

    const existing = await prisma.listingReview.findUnique({
      where: { listingId_userId: { listingId, userId } },
    });
    if (existing) {
      // Replace the old rating in the aggregate (mean recompute).
      const adjustedAgg = Number(
        (((listing.ratingAgg * listing.ratingCount) - existing.rating + rating) / listing.ratingCount).toFixed(3),
      );
      const item = await prisma.listingReview.update({
        where: { id: existing.id },
        data: { rating, review: review ?? null },
      });
      await prisma.marketplaceListing.update({
        where: { id: listingId },
        data: {
          ratingAgg: adjustedAgg,
          trendingScore: computeTrendingScore(
            listing.downloadCount,
            adjustedAgg,
            listing.ratingCount,
            (Date.now() - listing.createdAt.getTime()) / 86_400_000,
          ),
        },
      });
      return item;
    }

    const { agg, count } = mergeRatingAgg(listing.ratingAgg, listing.ratingCount, rating);
    const item = await prisma.listingReview.create({
      data: { listingId, userId, rating, review: review ?? null },
    });
    await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        ratingAgg: agg,
        ratingCount: count,
        trendingScore: computeTrendingScore(
          listing.downloadCount,
          agg,
          count,
          (Date.now() - listing.createdAt.getTime()) / 86_400_000,
        ),
      },
    });
    return item;
  }

  /** Record a download (once per user per listing) and bump counters. */
  async download(listingId: string, userId: string) {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "published") return null;
    if (listing.authorId === userId) return { ...listing, downloaded: true };

    await prisma.listingDownload.upsert({
      where: { listingId_userId: { listingId, userId } },
      create: { listingId, userId },
      update: {},
    });

    const updated = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: {
        downloadCount: { increment: 1 },
        trendingScore: computeTrendingScore(
          listing.downloadCount + 1,
          listing.ratingAgg,
          listing.ratingCount,
          (Date.now() - listing.createdAt.getTime()) / 86_400_000,
        ),
      },
    });
    return updated;
  }

  /** Creator profile + their listings + follower/following counts. */
  async creatorByHandle(handle: string, viewerId?: string) {
    const profile = await prisma.creatorProfile.findUnique({
      where: { handle },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    if (!profile) return null;

    const [listings, followerCount, followingCount, isFollowing] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where: { authorId: profile.userId, status: "published" },
        orderBy: { trendingScore: "desc" },
        take: 50,
      }),
      prisma.creatorFollow.count({ where: { followingId: profile.userId } }),
      prisma.creatorFollow.count({ where: { followerId: profile.userId } }),
      viewerId
        ? prisma.creatorFollow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: profile.userId } },
          })
        : null,
    ]);

    return { ...profile, listings, followerCount, followingCount, isFollowing: Boolean(isFollowing) };
  }

  async follow(followerId: string, followingUserId: string): Promise<boolean> {
    if (followerId === followingUserId) return false;
    await prisma.creatorFollow.upsert({
      where: { followerId_followingId: { followerId, followingId: followingUserId } },
      create: { followerId, followingId: followingUserId },
      update: {},
    });
    return true;
  }

  async unfollow(followerId: string, followingUserId: string): Promise<boolean> {
    await prisma.creatorFollow
      .delete({ where: { followerId_followingId: { followerId, followingId: followingUserId } } })
      .catch(() => null);
    return true;
  }

  async myProfile(userId: string) {
    const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
    const listings = await prisma.marketplaceListing.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: "desc" },
    });
    const [followerCount, followingCount, totalDownloads] = await Promise.all([
      prisma.creatorFollow.count({ where: { followingId: userId } }),
      prisma.creatorFollow.count({ where: { followerId: userId } }),
      prisma.listingDownload.count({ where: { listing: { authorId: userId } } }),
    ]);
    return { profile, listings, followerCount, followingCount, totalDownloads };
  }

  async updateProfile(userId: string, data: { handle?: string; bio?: string | null; location?: string | null; website?: string | null }) {
    try {
      return await prisma.creatorProfile.upsert({
        where: { userId },
        create: {
          userId,
          handle: data.handle?.trim() || `creator_${userId.slice(0, 8)}`,
          bio: data.bio ?? null,
          location: data.location ?? null,
          website: data.website ?? null,
        },
        update: {
          ...(data.handle ? { handle: data.handle.trim() } : {}),
          ...(data.bio !== undefined ? { bio: data.bio || null } : {}),
          ...(data.location !== undefined ? { location: data.location || null } : {}),
          ...(data.website !== undefined ? { website: data.website || null } : {}),
        },
      });
    } catch (error) {
      logger.warn(`[Marketplace] Profile update failed for ${userId}: ${String(error)}`);
      return null; // likely handle conflict
    }
  }

  /** All tags across published listings (for the tag filter sidebar). */
  async popularTags(limit = 20) {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: "published" },
      select: { tags: true },
      take: 500,
    });
    const counts = new Map<string, number>();
    for (const l of listings) {
      for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  /** Featured listings for the marketplace home hero row. */
  async featured(limit = 6) {
    return prisma.marketplaceListing.findMany({
      where: { status: "published", featured: true },
      orderBy: { trendingScore: "desc" },
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true, creatorProfile: { select: { handle: true } } } },
      },
    });
  }
}

export const marketplaceService = new MarketplaceService();
