"use server";

// Sell actions — fixed pipeline: auth → Zod parse → service → revalidate (§3.2).

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/users";
import {
  createListing,
  deleteListing,
  DomainError,
  updateListing,
} from "@/services/listings";
import { listingSchema } from "@/lib/zod-schemas";

type PublishResult =
  | { ok: true; id: number; bookloopId: string }
  | { ok: false; error: string };

function mapError(err: unknown): { ok: false; error: string } {
  if (err instanceof DomainError) return { ok: false, error: err.userMessage };
  if (err instanceof Error && err.message === "UNAUTHENTICATED")
    return { ok: false, error: "Sign in to continue." };
  if (err instanceof Error && err.message === "EMAIL_UNCONFIRMED")
    return { ok: false, error: "Confirm your email to list books — check your inbox." };
  console.error("[sell action]", err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function publishListingAction(raw: unknown): Promise<PublishResult> {
  try {
    const profile = await requireUser({ confirmedEmail: true });
    const parsed = listingSchema.safeParse(raw);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const res = await createListing(parsed.data, profile.id);
    revalidatePath("/");
    return { ok: true, ...res };
  } catch (err) {
    return mapError(err);
  }
}

export async function updateListingAction(
  listingId: number,
  raw: unknown,
): Promise<PublishResult> {
  try {
    const profile = await requireUser({ confirmedEmail: true });
    const parsed = listingSchema.safeParse(raw);
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

    const res = await updateListing(listingId, parsed.data, profile.id);
    revalidatePath("/");
    revalidatePath(`/listings/${listingId}`);
    return { ok: true, ...res };
  } catch (err) {
    return mapError(err);
  }
}

export async function deleteListingAction(
  listingId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profile = await requireUser();
    await deleteListing(listingId, profile.id);
    revalidatePath("/");
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    return mapError(err);
  }
}
