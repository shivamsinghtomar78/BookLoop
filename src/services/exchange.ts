// Exchange & donate surfaces (Phase 5). "For you" matching is word-level in
// JS — no engine (D-031): an offer matches when every meaningful word of its
// wants_book appears in one of MY active listing titles (or vice versa).
// Fine at pilot scale; the real matching engine is post-pilot (PHASE-7B).

import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listings, transactions } from "@/db/schema";
import type { BookCardData } from "@/components/book-card";

function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 || /^\d+$/.test(w)); // keep "8" in "Class 8"
}

/** true when every meaningful word of `needle` appears in `hay`. */
function contains(hay: string, needle: string): boolean {
  const h = new Set(words(hay));
  const n = words(needle);
  return n.length > 0 && n.every((w) => h.has(w));
}

export function offerMatchesTitle(wantsBook: string, title: string): boolean {
  return contains(title, wantsBook) || contains(wantsBook, title);
}

export async function activeExchangeOffers(excludeSellerId?: number, limit = 50) {
  const db = getDb();
  const conds = [
    eq(listings.status, "active" as const),
    eq(listings.mode, "exchange" as const),
    isNotNull(listings.wantsBook),
  ];
  if (excludeSellerId) conds.push(ne(listings.sellerId, excludeSellerId));
  return db
    .select()
    .from(listings)
    .where(and(...conds))
    .orderBy(desc(listings.createdAt), desc(listings.id))
    .limit(limit);
}

/** Offers that WANT a book the viewer has actively listed (Task 5.2). */
export async function forYouExchangeOffers(userId: number) {
  const db = getDb();
  const mine = await db
    .select({ title: listings.title })
    .from(listings)
    .where(and(eq(listings.sellerId, userId), eq(listings.status, "active")));
  if (mine.length === 0) return [];

  const offers = await activeExchangeOffers(userId);
  return offers.filter((o) =>
    mine.some((m) => offerMatchesTitle(o.wantsBook!, m.title)),
  );
}

/** Completed donations by this user (Task 5.6 — donor badge). */
export async function completedDonations(userId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.sellerId, userId),
        eq(transactions.mode, "donate"),
        isNotNull(transactions.buyerConfirmedAt),
      ),
    );
  return rows.length;
}

export function toCardData(
  rows: (typeof listings.$inferSelect)[],
  cover: Map<number, string>,
): BookCardData[] {
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
    photoUrl: cover.get(r.id) ?? null,
  }));
}
