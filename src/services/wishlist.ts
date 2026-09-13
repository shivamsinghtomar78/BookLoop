// Wishlist service (Task 3.4) — save/unsave listings, list with live status,
// trending fallback for the empty state (WORKFLOW.md §9).

import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listingPhotos, listings, wishlistItems } from "@/db/schema";
import { DomainError } from "@/services/listings";

export async function toggleWishlist(userId: number, listingId: number) {
  const db = getDb();
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing || listing.status === "deleted")
    throw new DomainError("That listing doesn't exist.");
  if (listing.sellerId === userId)
    throw new DomainError("That's your own listing.");

  const [existing] = await db
    .select()
    .from(wishlistItems)
    .where(
      and(eq(wishlistItems.userId, userId), eq(wishlistItems.listingId, listingId)),
    )
    .limit(1);

  if (existing) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
    return { saved: false };
  }
  await db.insert(wishlistItems).values({ userId, listingId });
  return { saved: true };
}

export async function wishlistedIds(
  userId: number,
  listingIds: number[],
): Promise<Set<number>> {
  if (listingIds.length === 0) return new Set();
  const db = getDb();
  const rows = await db
    .select({ listingId: wishlistItems.listingId })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.userId, userId),
        inArray(wishlistItems.listingId, listingIds),
      ),
    );
  return new Set(rows.map((r) => r.listingId));
}

export async function myWishlist(userId: number) {
  const db = getDb();
  const items = await db
    .select({
      itemId: wishlistItems.id,
      listing: listings,
    })
    .from(wishlistItems)
    .innerJoin(listings, eq(listings.id, wishlistItems.listingId))
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.createdAt));

  const ids = items.map((i) => i.listing.id);
  const photos = ids.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, ids))
    : [];
  const cover = new Map<number, string>();
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!cover.has(p.listingId)) cover.set(p.listingId, p.url);
  }
  return items.map((i) => ({
    ...i.listing,
    photoUrl: cover.get(i.listing.id) ?? null,
  }));
}
