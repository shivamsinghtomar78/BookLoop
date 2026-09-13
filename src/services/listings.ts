// Listings service (Task 2.5/2.7) — ALL business rules here, never in UI:
// rate limit, ownership, atomic create, BookLoop ID generation.
// Services take an explicit sellerId; auth happens in the action layer.

import { and, eq, ne, sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listingPhotos, listings } from "@/db/schema";
import { BOOKLOOP_ID_PREFIX, LIMITS } from "@/lib/constants";
import type { ListingInput } from "@/lib/zod-schemas";

export class DomainError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
  }
}

function toRow(input: ListingInput, sellerId: number) {
  const isText = input.category === "textbook" || input.category === "reference";
  const isComp = input.category === "competitive";
  const isNovel = input.category === "novel";
  return {
    sellerId,
    title: input.title,
    category: input.category,
    mode: input.mode,
    class: isText ? (input.class ?? null) : null,
    subject: isText || isComp ? input.subject || null : null,
    exam: isComp ? input.exam || null : null,
    genre: isNovel ? input.genre || null : null,
    author: isNovel ? input.author || null : null,
    editionYear: input.editionYear || null,
    condition: input.condition,
    conditionNote: input.conditionNote || null,
    priceInr: input.mode === "sell" ? (input.priceInr ?? null) : null,
    wantsBook: input.mode === "exchange" ? input.wantsBook || null : null,
  };
}

export async function createListing(input: ListingInput, sellerId: number) {
  const db = getDb();

  // Rate limit: max active listings per user (D-039)
  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), eq(listings.status, "active")));
  if (count >= LIMITS.maxActiveListingsPerUser) {
    throw new DomainError(
      `You already have ${LIMITS.maxActiveListingsPerUser} active listings — close or delete one first.`,
    );
  }

  // Reserve the id up front so listing + photos commit in ONE atomic batch
  // (neon-http has no interactive transactions; db.batch is atomic — D-035).
  const [{ nextId }] = await db.execute<{ nextId: number }>(
    dsql`SELECT nextval(pg_get_serial_sequence('listings', 'id'))::int AS "nextId"`,
  ).then((r) => r.rows as { nextId: number }[]);

  const bookloopId = `${BOOKLOOP_ID_PREFIX}${String(nextId).padStart(4, "0")}`;

  await db.batch([
    db.insert(listings).values({ ...toRow(input, sellerId), id: nextId, bookloopId }),
    db.insert(listingPhotos).values(
      input.photos.map((url, i) => ({
        listingId: nextId,
        url,
        sortOrder: i + 1,
      })),
    ),
  ]);

  return { id: nextId, bookloopId };
}

async function ownedListing(listingId: number, sellerId: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!row || row.status === "deleted")
    throw new DomainError("That listing doesn't exist.");
  if (row.sellerId !== sellerId)
    throw new DomainError("You can only edit your own listings.");
  return row;
}

export async function updateListing(
  listingId: number,
  input: ListingInput,
  sellerId: number,
) {
  const db = getDb();
  const existing = await ownedListing(listingId, sellerId);
  if (existing.status !== "active")
    throw new DomainError("Only active listings can be edited.");

  await db.batch([
    db
      .update(listings)
      .set({ ...toRow(input, sellerId), updatedAt: new Date() })
      .where(eq(listings.id, listingId)),
    db.delete(listingPhotos).where(eq(listingPhotos.listingId, listingId)),
    db.insert(listingPhotos).values(
      input.photos.map((url, i) => ({
        listingId,
        url,
        sortOrder: i + 1,
      })),
    ),
  ]);
  return { id: listingId, bookloopId: existing.bookloopId };
}

export async function deleteListing(listingId: number, sellerId: number) {
  const db = getDb();
  await ownedListing(listingId, sellerId);
  await db
    .update(listings)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(eq(listings.id, listingId));
}

export async function getOwnedListingForEdit(listingId: number, sellerId: number) {
  const db = getDb();
  const row = await ownedListing(listingId, sellerId);
  const photos = await db
    .select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, listingId))
    .orderBy(listingPhotos.sortOrder);
  return { ...row, photos: photos.map((p) => p.url) };
}

export async function myListings(sellerId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.sellerId, sellerId), ne(listings.status, "deleted")))
    .orderBy(dsql`${listings.createdAt} DESC`);
  return rows;
}
