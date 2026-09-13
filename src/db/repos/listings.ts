// Listings repo — Drizzle queries only, no business decisions (ARCHITECTURE.md §2).

import { and, desc, eq, gte, ilike, inArray, lte, sql as dsql } from "drizzle-orm";
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
    .where(and(eq(listings.status, "active"), eq(listings.mode, mode)))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(limit);
  return attachFirstPhotos(rows);
}

export async function activeListingsForClass(
  cls: number,
  limit = 12,
): Promise<BookCardData[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.status, "active"), eq(listings.class, cls)))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(limit);
  return attachFirstPhotos(rows);
}

// ---------- Search (Task 3.2) ----------

export type SearchFilters = {
  q?: string;
  mode?: "sell" | "exchange" | "donate";
  category?: "textbook" | "reference" | "competitive" | "novel";
  class?: number;
  subject?: string;
  exam?: string;
  condition?: "like_new" | "good" | "fair" | "worn";
  price?: "u100" | "100to200" | "o200"; // preset ranges (slider = post-pilot polish)
};

function searchConditions(f: SearchFilters) {
  const conds = [eq(listings.status, "active" as const)];
  if (f.q) conds.push(ilike(listings.title, `%${f.q}%`));
  if (f.mode) conds.push(eq(listings.mode, f.mode));
  if (f.category) conds.push(eq(listings.category, f.category));
  if (f.class) conds.push(eq(listings.class, f.class));
  if (f.subject) conds.push(ilike(listings.subject, `%${f.subject}%`));
  if (f.exam) conds.push(ilike(listings.exam, `%${f.exam}%`));
  if (f.condition) conds.push(eq(listings.condition, f.condition));
  if (f.price === "u100")
    conds.push(and(eq(listings.mode, "sell"), lte(listings.priceInr, 100))!);
  if (f.price === "100to200")
    conds.push(
      and(
        eq(listings.mode, "sell"),
        gte(listings.priceInr, 100),
        lte(listings.priceInr, 200),
      )!,
    );
  if (f.price === "o200")
    conds.push(and(eq(listings.mode, "sell"), gte(listings.priceInr, 200))!);
  return and(...conds);
}

/** Filtered search; when the viewer has a class and no explicit class filter,
    their class sorts first (smart default — WORKFLOW.md §3). */
export async function searchListings(
  filters: SearchFilters,
  viewerClass?: number,
  limit = 60,
): Promise<BookCardData[]> {
  const db = getDb();
  // ORDER BY a bare integer literal is a positional reference in Postgres —
  // only add the class-first CASE when it actually applies.
  const order = [];
  if (viewerClass && !filters.class) {
    order.push(
      dsql`CASE WHEN ${listings.class} = ${viewerClass} THEN 0 ELSE 1 END`,
    );
  }
  order.push(desc(listings.createdAt), desc(listings.id));
  const rows = await db
    .select()
    .from(listings)
    .where(searchConditions(filters))
    .orderBy(...order)
    .limit(limit);
  return attachFirstPhotos(rows);
}

/** Count for the relaxed-filter suggestion in the empty state (WORKFLOW.md §9). */
export async function countForClass(cls: number): Promise<number> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.status, "active"), eq(listings.class, cls)));
  return count;
}
