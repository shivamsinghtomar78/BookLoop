// Chat page — server wrapper: participant check, lazy 72h expiry, marks the
// chat's notifications read, hands initial data to the client ChatScreen.

import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChatScreen } from "@/components/chat/chat-screen";
import { getCurrentUser } from "@/services/users";
import { getChatForUser, markChatRead, messagesAfter } from "@/services/chat";
import { expireStaleReservation, getTxState } from "@/services/transactions";
import { DomainError } from "@/services/listings";
import { getDb } from "@/db/client";
import { listingPhotos } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/");

  const { id: idStr } = await params;
  const chatId = Number(idStr);
  if (!Number.isInteger(chatId)) notFound();

  try {
    const ctx = await getChatForUser(chatId, current.profile.id);
    await expireStaleReservation(ctx.listing.id); // D-043 lazy check
    const [msgs, state, photos] = await Promise.all([
      messagesAfter(chatId, current.profile.id, 0),
      getTxState(ctx.listing.id, current.profile.id),
      getDb()
        .select()
        .from(listingPhotos)
        .where(eq(listingPhotos.listingId, ctx.listing.id))
        .orderBy(listingPhotos.sortOrder)
        .limit(1),
    ]);
    await markChatRead(ctx.listing.id, current.profile.id);

    return (
      <ChatScreen
        chatId={chatId}
        meId={current.profile.id}
        role={ctx.role}
        otherName={ctx.role === "buyer" ? ctx.seller.fullName : ctx.buyer.fullName}
        listing={{
          id: ctx.listing.id,
          title: ctx.listing.title,
          priceInr: ctx.listing.priceInr,
          mode: ctx.listing.mode,
          photoUrl: photos[0]?.url ?? null,
        }}
        initialMessages={msgs.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.body,
          at: m.createdAt.toISOString(),
        }))}
        initialState={state}
      />
    );
  } catch (err) {
    if (err instanceof DomainError) notFound();
    throw err;
  }
}
