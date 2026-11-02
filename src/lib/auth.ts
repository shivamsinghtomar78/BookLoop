// Better Auth server config (D-019, reaffirmed D-053).
// Sessions and password hashes live in our own Neon DB.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { LIMITS } from "@/lib/constants";
import { siteUrl } from "@/lib/site-url";

// TESTING MODE (D-059): email verification removed — signup/login is plain
// email + password. Re-enable for full launch: restore the emailVerification
// block from git history (Phase 1 commit) and the gates it fed.

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/** Public origin of this deployment — the auth baseURL (Vercel-aware). */
function canonicalOrigin(): string {
  return siteUrl().replace(/\/+$/, "");
}

/**
 * Every origin allowed to POST to /api/auth. The deployment's own origin is
 * always included so Vercel works without BETTER_AUTH_URL being set; extra
 * hosts come from env (preview/staging/custom domain). A localhost entry is
 * dropped when the deployment itself is HTTPS, since a stale
 * BETTER_AUTH_URL=http://localhost:3000 otherwise rejects every real request
 * with INVALID_ORIGIN.
 */
export function appOrigins(): string[] {
  const canonical = canonicalOrigin();
  const secure = canonical.startsWith("https://");
  const raw = [
    canonical,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : "",
    process.env.APP_ORIGINS ?? "",
  ]
    .filter(Boolean)
    .join(",");

  const origins = raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return [...new Set(origins)].filter((o) => !(secure && LOCAL_ORIGIN.test(o)));
}

const origins = appOrigins();
const httpsOrigin = origins.some((o) => o.startsWith("https://"));

// A school lab shares one NAT IP, so these are per-IP ceilings, not per-student
// ones. Keep them generous and allow the QA stack to turn them off.
const rateLimitOff = process.env.AUTH_RATE_LIMIT === "off";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema: authSchema }),
  baseURL: canonicalOrigin(),
  trustedOrigins: origins,
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
