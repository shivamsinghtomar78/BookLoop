// Better Auth server config (D-019, reaffirmed D-053).
// Sessions, password hashes and verification tokens live in our own Neon DB.
// Email delivery: Resend when RESEND_API_KEY is set, console fallback in dev.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { getDb } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { LIMITS } from "@/lib/constants";

const FROM = "BookLoop <onboarding@resend.dev>";

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback — the verification URL lands in the server log (Task 1.4)
    console.log(`[email dev-fallback] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  try {
    await new Resend(key).emails.send({ from: FROM, to, subject, text });
  } catch (err) {
    // Email is always best-effort (ARCHITECTURE.md rule 6) — never crash the flow
    console.error("[email] send failed", { to, subject, err });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: LIMITS.minPasswordLength,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Confirm your BookLoop email",
        [
          `Hi ${user.name},`,
          "",
          "Confirm your email to start listing and chatting on BookLoop:",
          url,
          "",
          "If you didn't create this account, you can ignore this email.",
        ].join("\n"),
      );
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
