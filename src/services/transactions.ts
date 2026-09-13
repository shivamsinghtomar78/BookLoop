// Transactions service (Tasks 4.5–4.7) — the ONLY writer of listings.status
// (ARCHITECTURE.md §3.5). Guards: only the seller reserves, only that chat's
// buyer confirms; UNIQUE transactions.listing_id makes double-reserve
// impossible even under races (D-039). Buyer confirmation closes the deal —
// the seller can never close alone. 72h zombie reservations expire lazily
// on read (D-043, no cron).

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listings, notifications, ratings, transactions, users } from "@/db/schema";
import { DomainError } from "@/services/listings";
import { getChatForUser } from "@/services/chat";
import { sendEmail } from "@/lib/email";
import { RESERVATION_EXPIRY_HOURS } from "@/lib/constants";

export type TxState = {
  listingStatus: "active" | "reserved" | "closed" | "deleted";
  reserved: boolean;
  reservedForMe: boolean; // viewer is the transaction's buyer
  confirmed: boolean;
  myRating: boolean | null; // thumbsUp value or null if not rated
  txId: number | null;
};

async function txForListing(listingId: number) {
  const db = getDb();
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.listingId, listingId))
    .limit(1);
  return tx ?? null;
}

/** Seller reserves the listing for this chat's buyer. */
export async function reserveForBuyer(chatId: number, sellerId: number) {
  const ctx = await getChatForUser(chatId, sellerId);
  if (ctx.role !== "seller")
    throw new DomainError("Only the seller can reserve the book.");
  if (ctx.listing.status !== "active")
    throw new DomainError("This listing isn't available to reserve.");

  const db = getDb();
  try {
    await db.batch([
      db.insert(transactions).values({
        listingId: ctx.listing.id,
        sellerId,
        buyerId: ctx.chat.buyerId,
        mode: ctx.listing.mode,
        priceInr: ctx.listing.priceInr,
      }),
      db
        .update(listings)
        .set({ status: "reserved", updatedAt: new Date() })
        .where(and(eq(listings.id, ctx.listing.id), eq(listings.status, "active"))),
    ]);
  } catch {
    // UNIQUE listing_id lost the race — someone already reserved it.
    throw new DomainError("This book was just reserved.");
  }

  await db.insert(notifications).values({
    userId: ctx.chat.buyerId,
    type: "confirm_handover",
    text: `"${ctx.listing.title}" is reserved for you — meet at the school pickup point`,
    listingId: ctx.listing.id,
  });
}

/** Either side cancels an unconfirmed reservation → back to active. */
export async function cancelReservation(chatId: number, userId: number) {
  const ctx = await getChatForUser(chatId, userId);
  const tx = await txForListing(ctx.listing.id);
  if (!tx || ctx.listing.status !== "reserved")
    throw new DomainError("There's no reservation to cancel.");
  if (tx.buyerId !== userId && tx.sellerId !== userId)
    throw new DomainError("You're not part of this reservation.");
  if (tx.buyerConfirmedAt)
    throw new DomainError("This handover is already confirmed.");

  const db = getDb();
  await db.batch([
    db.delete(transactions).where(eq(transactions.id, tx.id)),
    db
      .update(listings)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(listings.id, ctx.listing.id)),
  ]);

  const otherId = userId === tx.buyerId ? tx.sellerId : tx.buyerId;
  await db.insert(notifications).values({
    userId: otherId,
    type: "confirm_handover",
    text: `The reservation for "${ctx.listing.title}" was cancelled — it's available again`,
    listingId: ctx.listing.id,
  });
}

/** Seller nudge after handover: asks the buyer to confirm (notification + email). */
export async function askBuyerToConfirm(chatId: number, sellerId: number) {
  const ctx = await getChatForUser(chatId, sellerId);
  if (ctx.role !== "seller")
    throw new DomainError("Only the seller can mark the handover.");
  const tx = await txForListing(ctx.listing.id);
  if (!tx || ctx.listing.status !== "reserved")
    throw new DomainError("Reserve the book for the buyer first.");

  const db = getDb();
  await db.insert(notifications).values({
    userId: tx.buyerId,
    type: "confirm_handover",
    text: `Got "${ctx.listing.title}"? Tap Confirm received to finish the exchange`,
    listingId: ctx.listing.id,
  });
  void sendEmail(
    ctx.buyer.email,
    "Confirm you received your BookLoop book",
    `Hi ${ctx.buyer.fullName},\n\nThe seller marked "${ctx.listing.title}" as handed over. Open the chat and tap "Confirm received" to finish.\n\n— BookLoop`,
  );
}

/** Buyer confirms receipt → deal closes (Done step). */
export async function confirmReceived(chatId: number, buyerId: number) {
  const ctx = await getChatForUser(chatId, buyerId);
  if (ctx.role !== "buyer")
    throw new DomainError("Only the buyer can confirm receipt.");
  const tx = await txForListing(ctx.listing.id);
  if (!tx || tx.buyerId !== buyerId)
    throw new DomainError("There's no reservation for you on this book.");
  if (tx.buyerConfirmedAt) throw new DomainError("Already confirmed — thanks!");

  const db = getDb();
  await db.batch([
    db
      .update(transactions)
      .set({ buyerConfirmedAt: new Date() })
      .where(eq(transactions.id, tx.id)),
    db
      .update(listings)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(listings.id, ctx.listing.id)),
  ]);

  // Rate-now nudges, both sides (in-app + best-effort email)
  await db.insert(notifications).values([
    {
      userId: tx.sellerId,
      type: "confirm_handover" as const,
      text: `"${ctx.listing.title}" is done — leave a quick 👍`,
      listingId: ctx.listing.id,
    },
    {
      userId: tx.buyerId,
      type: "confirm_handover" as const,
      text: `"${ctx.listing.title}" is done — leave a quick 👍`,
      listingId: ctx.listing.id,
    },
  ]);
  void sendEmail(
    ctx.seller.email,
    "Your BookLoop book found its new home 🎉",
    `Hi ${ctx.seller.fullName},\n\n"${ctx.listing.title}" was confirmed received. Open the chat to leave a quick rating.\n\n— BookLoop`,
  );
}

/** One-tap 👍/👎 after close; each side rates once (Task 4.7). */
export async function rateTransaction(
  chatId: number,
  raterId: number,
  thumbsUp: boolean,
) {
  const ctx = await getChatForUser(chatId, raterId);
  const tx = await txForListing(ctx.listing.id);
  if (!tx || !tx.buyerConfirmedAt)
    throw new DomainError("You can rate after the handover is confirmed.");
  const rateeId = raterId === tx.buyerId ? tx.sellerId : tx.buyerId;

  const db = getDb();
  try {
    await db.insert(ratings).values({
      transactionId: tx.id,
      raterId,
      rateeId,
      thumbsUp,
    });
  } catch {
    throw new DomainError("You already rated this exchange.");
  }
}

/** Lazy 72h expiry (D-043): called on chat/listing reads. Quietly relists and
    notifies both sides. Never throws. */
export async function expireStaleReservation(listingId: number) {
  try {
    const db = getDb();
    const tx = await txForListing(listingId);
    if (!tx || tx.buyerConfirmedAt) return false;

    const ageH =
      (Date.now() - tx.sellerMarkedAt.getTime()) / (1000 * 60 * 60);
    if (ageH < RESERVATION_EXPIRY_HOURS) return false;

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!listing || listing.status !== "reserved") return false;

    await db.batch([
      db.delete(transactions).where(eq(transactions.id, tx.id)),
      db
        .update(listings)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(listings.id, listingId)),
    ]);
    await db.insert(notifications).values(
      [tx.buyerId, tx.sellerId].map((userId) => ({
        userId,
        type: "confirm_handover" as const,
        text: `The reservation for "${listing.title}" expired — the book is available again`,
        listingId,
      })),
    );
    return true;
  } catch (err) {
    console.error("[expiry] check failed", err);
    return false;
  }
}

/** State snapshot for the stepper — server-derived, identical for both sides. */
export async function getTxState(
  listingId: number,
  viewerId: number,
): Promise<TxState> {
  const db = getDb();
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  const tx = await txForListing(listingId);
  let myRating: boolean | null = null;
  if (tx) {
    const [r] = await db
      .select()
      .from(ratings)
      .where(
        and(eq(ratings.transactionId, tx.id), eq(ratings.raterId, viewerId)),
      )
      .limit(1);
    myRating = r ? r.thumbsUp : null;
  }
  return {
    listingStatus: listing?.status ?? "deleted",
    reserved: !!tx && !tx.buyerConfirmedAt,
    reservedForMe: !!tx && tx.buyerId === viewerId,
    confirmed: !!tx?.buyerConfirmedAt,
    myRating,
    txId: tx?.id ?? null,
  };
}
