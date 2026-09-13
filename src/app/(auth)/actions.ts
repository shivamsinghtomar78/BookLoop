"use server";

// Auth server actions — the fixed write pipeline (ARCHITECTURE.md §3.2):
// Zod parse → service/auth call → typed { ok } | { error }. nextCookies() sets sessions.

import { headers } from "next/headers";
import { APIError } from "better-auth";
import { auth } from "@/lib/auth";
import { createProfile } from "@/services/users";
import { loginSchema, signupSchema } from "@/lib/zod-schemas";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function signUpAction(raw: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  try {
    const res = await auth.api.signUpEmail({
      body: {
        name: input.fullName,
        email: input.email,
        password: input.password,
        callbackURL: "/email-verified",
      },
      headers: await headers(),
    });

    await createProfile({
      authId: res.user.id,
      fullName: input.fullName,
      schoolName: input.schoolName,
      age: input.age,
      class: input.class,
      email: input.email,
    });

    return { ok: true };
  } catch (err) {
    if (err instanceof APIError && err.status === "UNPROCESSABLE_ENTITY") {
      return { ok: false, error: "An account with this email already exists — try logging in." };
    }
    console.error("[signUpAction]", err);
    return { ok: false, error: "Couldn't create your account. Please try again." };
  }
}

export async function signInAction(raw: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await auth.api.signInEmail({
      body: { email: parsed.data.email, password: parsed.data.password },
      headers: await headers(),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof APIError) {
      // Same message for wrong email vs wrong password — no info leak (Task 1.5)
      return { ok: false, error: "Wrong email or password." };
    }
    console.error("[signInAction]", err);
    return { ok: false, error: "Couldn't log you in. Please try again." };
  }
}

export async function signOutAction(): Promise<ActionResult> {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't log out. Please try again." };
  }
}

export async function resendVerificationAction(): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { ok: false, error: "You're not logged in." };
    await auth.api.sendVerificationEmail({
      body: { email: session.user.email, callbackURL: "/email-verified" },
      headers: await headers(),
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't resend the email. Please try again." };
  }
}
