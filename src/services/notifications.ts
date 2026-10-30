// Notifications service (Task 3.7) — badge count, list, mark-as-read.
// Reservation notifications also resolve the viewer's chat for that listing so
// the bell can deep-link into the exact conversation (not just /chats).

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { chats, notifications, transactions } from "@/db/schema";
import { ensureTransactionColumns } from "@/db/ensure";

export async function unreadCount(userId: number): Promise<number> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return count;
}

export async function myNotifications(userId: number, limit = 50) {
  const db = getDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const listingIds = [
    ...new Set(
      rows.map((r) => r.listingId).filter((id): id is number => id != null),
    ),
  ];
  if (listingIds.length === 0) return rows.map((r) => ({ ...r, chatId: null }));

  await ensureTransactionColumns();
  const [txRows, chatRows] = await Promise.all([
    db
      .select({
        listingId: transactions.listingId,
        buyerId: transactions.buyerId,
        sellerId: transactions.sellerId,
      })
      .from(transactions)
      .where(inArray(transactions.listingId, listingIds)),
    db
      .select({
        id: chats.id,
        listingId: chats.listingId,
        buyerId: chats.buyerId,
      })
      .from(chats)
      .where(inArray(chats.listingId, listingIds)),
  ]);

  const chatForPair = new Map(
    chatRows.map((c) => [`${c.listingId}:${c.buyerId}`, c.id]),
  );
  const txByListing = new Map(txRows.map((t) => [t.listingId, t]));

  return rows.map((r) => {
    const tx = r.listingId != null ? txByListing.get(r.listingId) : undefined;
    let chatId: number | null = null;
    if (tx && (userId === tx.buyerId || userId === tx.sellerId)) {
      chatId = chatForPair.get(`${tx.listingId}:${tx.buyerId}`) ?? null;
    } else if (r.listingId != null) {
      // No reservation yet (chat_message): buyer has exactly one chat per
      // listing; sellers may have several, so only the buyer side is exact.
      const mine = chatRows.find(
        (c) => c.listingId === r.listingId && c.buyerId === userId,
      );
      chatId = mine?.id ?? null;
    }
    return { ...r, chatId };
  });
}

export async function markAllRead(userId: number) {
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
