// Chat service (Tasks 4.1–4.3): open/get chats, incremental messages,
// send with rate limits. Access control lives HERE — every read/write
// verifies the caller is one of the chat's two participants.

import { and, desc, eq, gt, inArray, or, sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  chats,
  listingPhotos,
  listings,
  messages,
  notifications,
  users,
} from "@/db/schema";
import { DomainError } from "@/services/listings";
import { LIMITS } from "@/lib/constants";

export type ChatContext = {
  chat: typeof chats.$inferSelect;
  listing: typeof listings.$inferSelect;
  buyer: typeof users.$inferSelect;
  seller: typeof users.$inferSelect;
  role: "buyer" | "seller";
};

/** Get-or-create the chat for (listing, buyer). Buyers open chats; sellers
    join the existing one. Rate limit: 10 new chats/day (D-039). */
export async function openChat(listingId: number, userId: number) {
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
    .from(chats)
    .where(and(eq(chats.listingId, listingId), eq(chats.buyerId, userId)))
    .limit(1);
  if (existing) return existing;

  const [{ todayCount }] = await db
    .select({ todayCount: dsql<number>`count(*)::int` })
    .from(chats)
    .where(
      and(
        eq(chats.buyerId, userId),
        dsql`${chats.createdAt} > now() - interval '1 day'`,
      ),
    );
  if (todayCount >= LIMITS.maxNewChatsPerDay)
    throw new DomainError(
      `You've started ${LIMITS.maxNewChatsPerDay} chats today — try again tomorrow.`,
    );

  try {
    const [chat] = await db
      .insert(chats)
      .values({ listingId, buyerId: userId })
      .returning();
    return chat;
  } catch {
    // Unique (listing, buyer) race: someone double-tapped — fetch the winner.
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.listingId, listingId), eq(chats.buyerId, userId)))
      .limit(1);
    if (chat) return chat;
    throw new DomainError("Couldn't open the chat. Please try again.");
  }
}

/** Load a chat with its listing + both participants; throws unless the
    caller is the buyer or the seller. */
export async function getChatForUser(
  chatId: number,
  userId: number,
): Promise<ChatContext> {
  const db = getDb();
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  if (!chat) throw new DomainError("That chat doesn't exist.");

  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, chat.listingId))
    .limit(1);
  if (!listing) throw new DomainError("That chat doesn't exist.");

  const isBuyer = chat.buyerId === userId;
  const isSeller = listing.sellerId === userId;
  if (!isBuyer && !isSeller)
    throw new DomainError("You're not part of this chat.");

  const [[buyer], [seller]] = await Promise.all([
    db.select().from(users).where(eq(users.id, chat.buyerId)).limit(1),
    db.select().from(users).where(eq(users.id, listing.sellerId)).limit(1),
  ]);

  return { chat, listing, buyer, seller, role: isBuyer ? "buyer" : "seller" };
}

/** Incremental fetch: only messages with id > after (Task 4.2). */
export async function messagesAfter(
  chatId: number,
  userId: number,
  after: number,
) {
  await getChatForUser(chatId, userId); // participant check
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), gt(messages.id, after)))
    .orderBy(messages.id);
}

export async function sendMessage(chatId: number, userId: number, body: string) {
  const ctx = await getChatForUser(chatId, userId);
  const db = getDb();

  // 1 msg/sec per sender (D-039) — uses the (chat, time) index
  const [last] = await db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), eq(messages.senderId, userId)))
    .orderBy(desc(messages.id))
    .limit(1);
  if (
    last &&
    Date.now() - last.createdAt.getTime() <
      LIMITS.minSecondsBetweenMessages * 1000
  ) {
    throw new DomainError("Slow down a little 🙂");
  }

  const [msg] = await db
    .insert(messages)
    .values({ chatId, senderId: userId, body })
    .returning();

  // Unread signal for the other side: one unread chat_message notification
  // per (user, listing) at a time — no spam, still lights the badge + dot.
  const recipientId =
    ctx.role === "buyer" ? ctx.listing.sellerId : ctx.chat.buyerId;
  const [existingUnread] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, recipientId),
        eq(notifications.type, "chat_message"),
        eq(notifications.listingId, ctx.listing.id),
        dsql`${notifications.readAt} IS NULL`,
      ),
    )
    .limit(1);
  if (!existingUnread) {
    await db.insert(notifications).values({
      userId: recipientId,
      type: "chat_message",
      text: `New message about "${ctx.listing.title}"`,
      listingId: ctx.listing.id,
    });
  }

  return msg;
}

/** Conversation list for the chats tab (Task 4.8): both roles, newest first,
    with cover photo, last message and unread flag. */
export async function listMyChats(userId: number) {
  const db = getDb();
  const rows = await db
    .select({ chat: chats, listing: listings })
    .from(chats)
    .innerJoin(listings, eq(listings.id, chats.listingId))
    .where(or(eq(chats.buyerId, userId), eq(listings.sellerId, userId)))
    .orderBy(desc(chats.createdAt));

  if (rows.length === 0) return [];

  const chatIds = rows.map((r) => r.chat.id);
  const listingIds = rows.map((r) => r.listing.id);

  const [lastMessages, photos, unreadNotifs, others] = await Promise.all([
    db
      .select()
      .from(messages)
      .where(inArray(messages.chatId, chatIds))
      .orderBy(desc(messages.id)),
    db.select().from(listingPhotos).where(inArray(listingPhotos.listingId, listingIds)),
    db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "chat_message"),
          inArray(notifications.listingId, listingIds),
          dsql`${notifications.readAt} IS NULL`,
        ),
      ),
    db
      .select()
      .from(users)
      .where(
        inArray(users.id, [
          ...new Set(rows.flatMap((r) => [r.chat.buyerId, r.listing.sellerId])),
        ]),
      ),
  ]);

  const lastByChat = new Map<number, (typeof lastMessages)[number]>();
  for (const m of lastMessages) if (!lastByChat.has(m.chatId)) lastByChat.set(m.chatId, m);
  const cover = new Map<number, string>();
  for (const p of photos.sort((a, b) => a.sortOrder - b.sortOrder))
    if (!cover.has(p.listingId)) cover.set(p.listingId, p.url);
  const unreadListingIds = new Set(unreadNotifs.map((n) => n.listingId));
  const userById = new Map(others.map((u) => [u.id, u]));

  return rows
    .map((r) => {
      const otherId =
        r.chat.buyerId === userId ? r.listing.sellerId : r.chat.buyerId;
      const last = lastByChat.get(r.chat.id);
      return {
        chatId: r.chat.id,
        listingId: r.listing.id,
        title: r.listing.title,
        status: r.listing.status,
        mode: r.listing.mode,
        photoUrl: cover.get(r.listing.id) ?? null,
        otherName: userById.get(otherId)?.fullName ?? "A student",
        lastMessage: last?.body ?? null,
        lastAt: last?.createdAt ?? r.chat.createdAt,
        unread: unreadListingIds.has(r.listing.id),
      };
    })
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
}

/** Opening a chat clears its unread notifications (badge + dot). */
export async function markChatRead(listingId: number, userId: number) {
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "chat_message"),
        eq(notifications.listingId, listingId),
        dsql`${notifications.readAt} IS NULL`,
      ),
    );
}
