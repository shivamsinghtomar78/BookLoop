// Transactions service (Tasks 4.5–4.7) — the ONLY writer of listings.status
// (ARCHITECTURE.md §3.5). Four gates: seller reserves → buyer accepts → seller
// marks the handover → buyer confirms receipt. Nobody can skip a gate, and each
// action notifies the other side. UNIQUE transactions.listing_id makes
// double-reserve impossible even under races (D-039). 72h zombie reservations
// expire lazily on read (D-043, no cron), but never after a handover — by then
// the buyer physically has the book.

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { atomically } from "@/db/atomic";
import { listings, notifications, ratings, transactions } from "@/db/schema";
import { ensureTransactionColumns } from "@/db/ensure";
import { DomainError } from "@/services/listings";
import { getChatForUser } from "@/services/chat";
import { sendEmail } from "@/lib/email";
import { RESERVATION_EXPIRY_HOURS } from "@/lib/constants";

export type TxState = {
  listingStatus: "active" | "reserved" | "closed" | "deleted";
  reserved: boolean;
  reservedForMe: boolean; // viewer is the transaction's buyer
  accepted: boolean;
  handedOver: boolean;
  confirmed: boolean;
  reservedAt: string | null;
  acceptedAt: string | null;
  handedOverAt: string | null;
  confirmedAt: string | null;
  myRating: boolean | null; // thumbsUp value or null if not rated
  txId: number | null;
};

const iso = (value: Date | null | undefined) =>
  value ? value.toISOString() : null;

async function txForListing(listingId: number) {
  await ensureTransactionColumns();
  const db = getDb();
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.listingId, listingId))
    .limit(1);
  return tx ?? null;
}

/** Seller reserves the listing for this chat's buyer. Gate 1. */
export async function reserveForBuyer(chatId: number, sellerId: number) {
  const ctx = await getChatForUser(chatId, sellerId);
  if (ctx.role !== "seller")
    throw new DomainError("Only the seller can reserve the book.");
  if (ctx.listing.status !== "active")
    throw new DomainError("This listing isn't available to reserve.");

  const db = getDb();
  const txValues = {
    listingId: ctx.listing.id,
    sellerId,
    buyerId: ctx.chat.buyerId,
    mode: ctx.listing.mode,
    priceInr: ctx.listing.priceInr,
  };
  const reserved = { status: "reserved" as const, updatedAt: new Date() };
  const guard = and(eq(listings.id, ctx.listing.id), eq(listings.status, "active"));
  try {
    await atomically(
      db,
      [
        db.insert(transactions).values(txValues),
        db.update(listings).set(reserved).where(guard),
      ],
      async (tx) => {
        await tx.insert(transactions).values(txValues);
        await tx.update(listings).set(reserved).where(guard);
      },
    );
  } catch {
    // UNIQUE listing_id lost the race — someone already reserved it.
    throw new DomainError("This book was just reserved.");
  }

  await db.insert(notifications).values({
    userId: ctx.chat.buyerId,
    type: "confirm_handover",
    text: `"${ctx.listing.title}" is reserved for you — accept to lock it in`,
    listingId: ctx.listing.id,
  });
}

/** Buyer accepts the reservation. Gate 2 — completes the "Reserved" step only. */
export async function acceptReservation(chatId: number, buyerId: number) {
  const ctx = await getChatForUser(chatId, buyerId);
  if (ctx.role !== "buyer")
    throw new DomainError("Only the buyer can accept the reservation.");
  const tx = await txForListing(ctx.listing.id);
  if (!tx || tx.buyerId !== buyerId)
    throw new DomainError("There's no reservation for you on this book.");
  if (tx.buyerConfirmedAt)
    throw new DomainError("This exchange is already complete.");
  if (tx.sellerHandedOverAt)
    throw new DomainError("This book was already handed over.");
  if (tx.buyerAcceptedAt) return; // double tap — nothing left to do

  const db = getDb();
  const acceptedAt = new Date();
  const [updated] = await db
    .update(transactions)
    .set({ buyerAcceptedAt: acceptedAt })
    .where(
      and(
        eq(transactions.id, tx.id),
        isNull(transactions.buyerAcceptedAt),
      ),
    )
    .returning({ id: transactions.id });
  if (!updated) return; // another tap won the race

  await db.insert(notifications).values({
    userId: tx.sellerId,
    type: "confirm_handover",
    text: `${ctx.buyer.fullName} accepted the reservation for "${ctx.listing.title}" — hand it over at the school pickup point`,
    listingId: ctx.listing.id,
  });
}

/** Either side cancels before the handover → back to active. */
export async function cancelReservation(chatId: number, userId: number) {
  const ctx = await getChatForUser(chatId, userId);
  const tx = await txForListing(ctx.listing.id);
  if (!tx || ctx.listing.status !== "reserved")
    throw new DomainError("There's no reservation to cancel.");
  if (tx.buyerId !== userId && tx.sellerId !== userId)
    throw new DomainError("You're not part of this reservation.");
  if (tx.buyerConfirmedAt)
    throw new DomainError("This handover is already confirmed.");
  if (tx.sellerHandedOverAt)
    throw new DomainError("The book is already handed over — the buyer needs to confirm.");

  const db = getDb();
  const released = { status: "active" as const, updatedAt: new Date() };
  await atomically(
    db,
    [
      db.delete(transactions).where(eq(transactions.id, tx.id)),
      db.update(listings).set(released).where(eq(listings.id, ctx.listing.id)),
    ],
    async (t) => {
      await t.delete(transactions).where(eq(transactions.id, tx.id));
      await t.update(listings).set(released).where(eq(listings.id, ctx.listing.id));
    },
  );

  const otherId = userId === tx.buyerId ? tx.sellerId : tx.buyerId;
  await db.insert(notifications).values({
    userId: otherId,
    type: "confirm_handover",
    text: `The reservation for "${ctx.listing.title}" was cancelled — it's available again`,
    listingId: ctx.listing.id,
  });
}

/** Seller marks the book handed over. Gate 3 — buyer must have accepted. */
export async function markHandedOver(chatId: number, sellerId: number) {
  const ctx = await getChatForUser(chatId, sellerId);
  if (ctx.role !== "seller")
    throw new DomainError("Only the seller can mark the handover.");
  const tx = await txForListing(ctx.listing.id);
  if (!tx || ctx.listing.status !== "reserved")
    throw new DomainError("Reserve the book for the buyer first.");
  if (tx.buyerConfirmedAt) return; // deal already closed
  if (!tx.buyerAcceptedAt)
    throw new DomainError("Wait for the buyer to accept the reservation first.");
  if (tx.sellerHandedOverAt) return; // double tap — already handed over

  const db = getDb();
  const handedOverAt = new Date();
  const [updated] = await db
    .update(transactions)
    .set({ sellerHandedOverAt: handedOverAt })
    .where(
      and(
        eq(transactions.id, tx.id),
        isNull(transactions.sellerHandedOverAt),
      ),
    )
    .returning({ id: transactions.id });
  if (!updated) return; // another tap won the race

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

/** Buyer confirms receipt. Gate 4 → deal closes (Done step). */
export async function confirmReceived(chatId: number, buyerId: number) {
  const ctx = await getChatForUser(chatId, buyerId);
  if (ctx.role !== "buyer")
    throw new DomainError("Only the buyer can confirm receipt.");
  const tx = await txForListing(ctx.listing.id);
  if (!tx || tx.buyerId !== buyerId)
    throw new DomainError("There's no reservation for you on this book.");
  if (tx.buyerConfirmedAt) throw new DomainError("Already confirmed — thanks!");
  if (!tx.sellerHandedOverAt)
    throw new DomainError("The seller hasn't marked the handover yet.");

  const db = getDb();
  const confirmedAt = new Date();
  await atomically(
    db,
    [
      db.update(transactions).set({ buyerConfirmedAt: confirmedAt }).where(eq(transactions.id, tx.id)),
      db
        .update(listings)
        .set({ status: "closed", updatedAt: confirmedAt })
        .where(eq(listings.id, ctx.listing.id)),
    ],
    async (t) => {
      await t.update(transactions).set({ buyerConfirmedAt: confirmedAt }).where(eq(transactions.id, tx.id));
      await t
        .update(listings)
        .set({ status: "closed", updatedAt: confirmedAt })
        .where(eq(listings.id, ctx.listing.id));
    },
  );

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
    notifies both sides. Never expires once handed over. Never throws. */
export async function expireStaleReservation(listingId: number) {
  try {
    const db = getDb();
    const tx = await txForListing(listingId);
    if (!tx || tx.buyerConfirmedAt || tx.sellerHandedOverAt) return false;

    // Acceptance restarts the meeting clock.
    const since = tx.buyerAcceptedAt ?? tx.sellerMarkedAt;
    const ageH = (Date.now() - since.getTime()) / (1000 * 60 * 60);
    if (ageH < RESERVATION_EXPIRY_HOURS) return false;

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!listing || listing.status !== "reserved") return false;

    const released = { status: "active" as const, updatedAt: new Date() };
    await atomically(
      db,
      [
        db.delete(transactions).where(eq(transactions.id, tx.id)),
        db.update(listings).set(released).where(eq(listings.id, listingId)),
      ],
      async (t) => {
        await t.delete(transactions).where(eq(transactions.id, tx.id));
        await t.update(listings).set(released).where(eq(listings.id, listingId));
      },
    );
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
    accepted: !!tx?.buyerAcceptedAt,
    handedOver: !!tx?.sellerHandedOverAt,
    confirmed: !!tx?.buyerConfirmedAt,
    reservedAt: iso(tx?.sellerMarkedAt),
    acceptedAt: iso(tx?.buyerAcceptedAt),
    handedOverAt: iso(tx?.sellerHandedOverAt),
    confirmedAt: iso(tx?.buyerConfirmedAt),
    myRating,
    txId: tx?.id ?? null,
  };
}
