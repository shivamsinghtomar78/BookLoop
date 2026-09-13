// Better Auth server config (D-019, reaffirmed D-053).
// Sessions, password hashes and verification tokens live in our own Neon DB.
// Email delivery: Resend when RESEND_API_KEY is set, console fallback in dev.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { LIMITS } from "@/lib/constants";
import { sendEmail } from "@/lib/email";

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
