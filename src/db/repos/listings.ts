// Listings repo — Drizzle queries only, no business decisions (ARCHITECTURE.md §2).

import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listingPhotos, listings } from "@/db/schema";
import type { BookCardData } from "@/components/book-card";

async function attachFirstPhotos(
  rows: (typeof listings.$inferSelect)[],
): Promise<BookCardData[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const photos = await db
    .select()
    .from(listingPhotos)
    .where(
      inArray(
        listingPhotos.listingId,
        rows.map((r) => r.id),
      ),
    );
  const firstPhoto = new Map<number, string>();
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!firstPhoto.has(p.listingId)) firstPhoto.set(p.listingId, p.url);
  }
  return rows.map((r) => ({
    id: r.id,
    bookloopId: r.bookloopId,
    title: r.title,
    mode: r.mode,
    condition: r.condition,
    class: r.class,
    subject: r.subject,
    genre: r.genre,
    priceInr: r.priceInr,
    wantsBook: r.wantsBook,
    photoUrl: firstPhoto.get(r.id) ?? null,
  }));
}

export async function recentActiveListings(limit = 10): Promise<BookCardData[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(limit);
  return attachFirstPhotos(rows);
}

export async function activeListingsByMode(
  mode: "sell" | "exchange" | "donate",
  limit = 10,
): Promise<BookCardData[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(50);
  return attachFirstPhotos(rows.filter((r) => r.mode === mode).slice(0, limit));
}
