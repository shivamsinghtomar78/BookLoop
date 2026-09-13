// Users service — profile creation + session→profile resolution.
// All business rules live here, never in UI (ARCHITECTURE.md §2).

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export type Profile = typeof users.$inferSelect;

export async function createProfile(input: {
  authId: string;
  fullName: string;
  schoolName: string;
  age: number;
  class: number;
  email: string;
}): Promise<Profile> {
  const db = getDb();
  const [profile] = await db
    .insert(users)
    // TESTING MODE (D-059): accounts are born confirmed — no email gate.
    .values({ ...input, emailConfirmed: true })
    .returning();
  return profile;
}

/** Session + linked BookLoop profile; null when logged out. */
export async function getCurrentUser(): Promise<{
  profile: Profile;
  emailConfirmed: boolean;
} | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const db = getDb();
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.authId, session.user.id))
    .limit(1);
  if (!profile) return null;

  return { profile, emailConfirmed: profile.emailConfirmed };
}

/** For gated pages/actions. Throws typed errors the action layer maps to messages. */
export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) throw new Error("UNAUTHENTICATED");
  return current.profile;
}
