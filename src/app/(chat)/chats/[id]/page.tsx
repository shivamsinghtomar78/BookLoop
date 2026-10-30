// Chat page — server wrapper: participant check, lazy 72h expiry, marks the
// chat's notifications read, hands initial data to the client ChatScreen. Lives
// in its own route group so the thread can fill the screen (mobile) and show a
// conversation list beside it (desktop).

import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChatScreen } from "@/components/chat/chat-screen";
import { ChatShell } from "@/components/chat/chat-shell";
import { getCurrentUser } from "@/services/users";
import {
  getChatForUser,
  listMyChats,
  markChatRead,
  messagesAfter,
} from "@/services/chat";
import { expireStaleReservation, getTxState } from "@/services/transactions";
import { DomainError } from "@/services/listings";
import { getDb } from "@/db/client";
import { listingPhotos } from "@/db/schema";

export const dynamic = "force-dynamic";

type ChatData = {
  ctx: Awaited<ReturnType<typeof getChatForUser>>;
  msgs: Awaited<ReturnType<typeof messagesAfter>>;
  state: Awaited<ReturnType<typeof getTxState>>;
  photoUrl: string | null;
};

async function loadChat(chatId: number, userId: number): Promise<ChatData> {
  const ctx = await getChatForUser(chatId, userId);
  await expireStaleReservation(ctx.listing.id); // D-043 lazy check

  const [msgs, state, photos] = await Promise.all([
    messagesAfter(chatId, userId, 0),
    getTxState(ctx.listing.id, userId),
    getDb()
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.listingId, ctx.listing.id))
      .orderBy(listingPhotos.sortOrder)
      .limit(1),
  ]);
  await markChatRead(ctx.listing.id, userId);

  return { ctx, msgs, state, photoUrl: photos[0]?.url ?? null };
}

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

  let data: ChatData;
  try {
    data = await loadChat(chatId, current.profile.id);
  } catch (err) {
    if (err instanceof DomainError) notFound();
    throw err;
  }
  const chats = await listMyChats(current.profile.id);

  const { ctx, msgs, state, photoUrl } = data;

  return (
    <ChatShell chats={chats} activeChatId={chatId}>
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
          photoUrl,
        }}
        initialMessages={msgs.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          body: m.body,
          at: m.createdAt.toISOString(),
        }))}
        initialState={state}
      />
    </ChatShell>
  );
}
