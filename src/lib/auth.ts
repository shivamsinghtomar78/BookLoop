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

/** BETTER_AUTH_URL plus any extra origins (comma-separated APP_ORIGINS). */
export function appOrigins(): string[] {
  const raw = [process.env.BETTER_AUTH_URL, process.env.APP_ORIGINS]
    .filter(Boolean)
    .join(",");
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const httpsOrigin = appOrigins().some((o) => o.startsWith("https://"));

// A school lab shares one NAT IP, so these are per-IP ceilings, not per-student
// ones. Keep them generous and allow the QA stack to turn them off.
const rateLimitOff = process.env.AUTH_RATE_LIMIT === "off";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: appOrigins(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: LIMITS.minPasswordLength,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  // Touch login/registration far less than general reads (QA SEC-04).
  rateLimit: rateLimitOff
    ? { enabled: false }
    : {
        enabled: true,
        window: 60,
        max: 120,
        customRules: {
          "/sign-in/email": { window: 60, max: 20 },
          "/sign-up/email": { window: 60, max: 10 },
          "/request-password-reset": { window: 60, max: 5 },
        },
      },
  advanced: {
    // Secure cookies only where the origin is actually HTTPS, so a local
    // production build over http://localhost keeps working.
    useSecureCookies: httpsOrigin,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      ...(httpsOrigin ? { secure: true } : {}),
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
