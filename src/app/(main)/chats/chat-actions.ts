"use server";

// Chat & transaction actions (Phase 4) — the fixed pipeline (§3.2).
// Every write ends with a pg_notify so the socket.io server pushes instantly
// (D-055); polling covers clients without a socket.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/services/users";
import { DomainError } from "@/services/listings";
import { openChat, sendMessage } from "@/services/chat";
import {
  askBuyerToConfirm,
  cancelReservation,
  confirmReceived,
  rateTransaction,
  reserveForBuyer,
} from "@/services/transactions";
import { notifyChatEvent } from "@/lib/realtime";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function mapError(err: unknown): { ok: false; error: string } {
  if (err instanceof DomainError) return { ok: false, error: err.userMessage };
  if (err instanceof Error && err.message === "UNAUTHENTICATED")
    return { ok: false, error: "Sign in to continue." };
  console.error("[chat action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function openChatAction(
  listingId: number,
): Promise<Result<{ chatId: number }>> {
  try {
    const profile = await requireUser();
    const parsed = z.number().int().positive().safeParse(listingId);
    if (!parsed.success) return { ok: false, error: "Invalid listing" };
    const chat = await openChat(parsed.data, profile.id);
    return { ok: true, chatId: chat.id };
  } catch (err) {
    return mapError(err);
  }
}

const messageSchema = z.string().trim().min(1, "Say something 🙂").max(1000);

export async function sendMessageAction(
  chatId: number,
  rawBody: unknown,
): Promise<Result<{ id: number; at: string }>> {
  try {
    const profile = await requireUser();
    const parsed = messageSchema.safeParse(rawBody);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message" };

    const msg = await sendMessage(chatId, profile.id, parsed.data);
    await notifyChatEvent({
      kind: "message",
      chatId,
      message: {
        id: msg.id,
        senderId: msg.senderId,
        body: msg.body,
        at: msg.createdAt.toISOString(),
      },
    });
    return { ok: true, id: msg.id, at: msg.createdAt.toISOString() };
  } catch (err) {
    return mapError(err);
  }
}

async function stateAction(
  chatId: number,
  fn: (chatId: number, userId: number) => Promise<unknown>,
): Promise<Result> {
  try {
    const profile = await requireUser();
    await fn(chatId, profile.id);
    await notifyChatEvent({ kind: "state", chatId });
    revalidatePath("/");
    revalidatePath("/chats");
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function reserveAction(chatId: number) {
  return stateAction(chatId, reserveForBuyer);
}

export async function cancelReservationAction(chatId: number) {
  return stateAction(chatId, cancelReservation);
}

export async function askConfirmAction(chatId: number) {
  return stateAction(chatId, askBuyerToConfirm);
}

export async function confirmReceivedAction(chatId: number) {
  return stateAction(chatId, confirmReceived);
}

export async function rateAction(
  chatId: number,
  thumbsUp: boolean,
): Promise<Result> {
  try {
    const profile = await requireUser();
    await rateTransaction(chatId, profile.id, thumbsUp);
    await notifyChatEvent({ kind: "state", chatId });
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}
