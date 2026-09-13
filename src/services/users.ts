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
    .values({ ...input, emailConfirmed: false })
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

  // Lazy sync: Better Auth owns email verification; mirror it to our flag once.
  if (session.user.emailVerified && !profile.emailConfirmed) {
    await db
      .update(users)
      .set({ emailConfirmed: true })
      .where(eq(users.id, profile.id));
    profile.emailConfirmed = true;
  }

  return { profile, emailConfirmed: profile.emailConfirmed };
}

/** For gated pages/actions. Throws typed errors the action layer maps to messages. */
export async function requireUser(opts?: { confirmedEmail?: boolean }) {
  const current = await getCurrentUser();
  if (!current) throw new Error("UNAUTHENTICATED");
  if (opts?.confirmedEmail && !current.emailConfirmed)
    throw new Error("EMAIL_UNCONFIRMED");
  return current.profile;
}
