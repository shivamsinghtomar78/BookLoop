"use server";

// Buy-side actions (Phase 3): wishlist toggle, alerts, notifications.
// Fixed pipeline: auth → parse → service → typed result (§3.2).

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/services/users";
import { DomainError } from "@/services/listings";
import { toggleWishlist } from "@/services/wishlist";
import { createAlert, deactivateAlert } from "@/services/alerts";
import { markAllRead } from "@/services/notifications";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function mapError(err: unknown): { ok: false; error: string } {
  if (err instanceof DomainError) return { ok: false, error: err.userMessage };
  if (err instanceof Error && err.message === "UNAUTHENTICATED")
    return { ok: false, error: "Sign in to continue." };
  console.error("[buy action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function toggleWishlistAction(
  listingId: number,
): Promise<Result<{ saved: boolean }>> {
  try {
    const profile = await requireUser();
    const parsed = z.number().int().positive().safeParse(listingId);
    if (!parsed.success) return { ok: false, error: "Invalid listing" };
    const res = await toggleWishlist(profile.id, parsed.data);
    revalidatePath("/profile");
    return { ok: true, ...res };
  } catch (err) {
    return mapError(err);
  }
}

const alertInputSchema = z.object({
  keyword: z.string().trim().max(80).optional(),
  category: z.enum(["textbook", "reference", "competitive", "novel"]).optional(),
  class: z.number().int().min(1).max(12).optional(),
  subject: z.string().trim().max(60).optional(),
});

export async function createAlertAction(raw: unknown): Promise<Result> {
  try {
    const profile = await requireUser();
    const parsed = alertInputSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Invalid alert" };
    await createAlert(profile.id, parsed.data);
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function deactivateAlertAction(alertId: number): Promise<Result> {
  try {
    const profile = await requireUser();
    await deactivateAlert(profile.id, alertId);
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}

export async function markNotificationsReadAction(): Promise<Result> {
  try {
    const profile = await requireUser();
    await markAllRead(profile.id);
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}
