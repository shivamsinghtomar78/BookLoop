// Better Auth server config (D-019, reaffirmed D-053).
// Sessions and password hashes live in our own Neon DB.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { LIMITS } from "@/lib/constants";

// TESTING MODE (D-059): email verification removed — signup/login is plain
// email + password. Re-enable for full launch: restore the emailVerification
// block from git history (Phase 1 commit) and the gates it fed.
export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: LIMITS.minPasswordLength,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
