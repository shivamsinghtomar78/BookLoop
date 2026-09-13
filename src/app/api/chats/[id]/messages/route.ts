// Polling fallback + history + state (Task 4.2, D-037): incremental fetch
// (?after=<id>) plus the transaction state, so both sides' steppers stay in
// sync even without the socket. Participant check inside the service.

import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/services/users";
import { getChatForUser, messagesAfter } from "@/services/chat";
import { expireStaleReservation, getTxState } from "@/services/transactions";
import { DomainError } from "@/services/listings";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const current = await getCurrentUser();
  if (!current) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const chatId = Number(idStr);
  if (!Number.isInteger(chatId))
    return Response.json({ error: "bad chat id" }, { status: 400 });

  const after = Number(request.nextUrl.searchParams.get("after") ?? 0);

  try {
    const ctx = await getChatForUser(chatId, current.profile.id);
    await expireStaleReservation(ctx.listing.id); // lazy 72h check (D-043)
    const [msgs, state] = await Promise.all([
      messagesAfter(chatId, current.profile.id, Number.isInteger(after) ? after : 0),
      getTxState(ctx.listing.id, current.profile.id),
    ]);
    return Response.json({
      messages: msgs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        body: m.body,
        at: m.createdAt.toISOString(),
      })),
      state,
    });
  } catch (err) {
    if (err instanceof DomainError)
      return Response.json({ error: err.userMessage }, { status: 403 });
    console.error("[chat poll]", err);
    return Response.json({ error: "server error" }, { status: 500 });
  }
}
