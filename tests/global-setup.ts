// One-time setup: verify the stack and test DB, then save signed-in browser
// states so specs don't spend their budget on login forms.

import { request } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import {
  ACCOUNTS,
  AUTH_DIR,
  BASE_URL,
  PASSWORD,
  storageStateFor,
  type Role,
} from "./support/env";
import { assertTestDb } from "../scripts/lib/test-db.mjs";

export default async function globalSetup() {
  await assertTestDb({ quiet: false });
  await mkdir(AUTH_DIR, { recursive: true });

  const health = await request.newContext({ baseURL: BASE_URL });
  try {
    const res = await health.get("/api/health", { timeout: 10_000 });
    if (!res.ok()) throw new Error(`/api/health returned ${res.status()}`);

    // A fresh build has an empty image cache, so the first visitor to a
    // photo-heavy page pays for sharp re-encoding every hero image. Warm the
    // public routes once (before workers start) so navigation budgets measure
    // the app, not first-request optimization.
    for (const path of [
      "/",
      "/search",
      "/search?q=science",
      "/exchange",
      "/donate",
      "/privacy",
      "/terms",
    ]) {
      await health.get(path, { timeout: 60_000 }).catch(() => {});
    }
  } catch (err) {
    throw new Error(
      `BookLoop is not reachable at ${BASE_URL}. Start the build under test (npm run build && npm run start) and re-run.\n${(err as Error).message}`,
    );
  } finally {
    await health.dispose();
  }

  for (const role of Object.keys(ACCOUNTS) as Role[]) {
    // Reuse a recent state so repeated runs don't trip sign-in rate limits —
    // but only after the server confirms the cookie still opens a session
    // (an auth upgrade can invalidate signed tokens without touching mtime).
    const path = storageStateFor(role);
    if (!process.env.QA_FRESH_LOGIN) {
      try {
        const info = await stat(path);
        if (Date.now() - info.mtimeMs < 20 * 60_000) {
          const cached = await request.newContext({
            baseURL: BASE_URL,
            storageState: path,
          });
          try {
            const res = await cached.get("/api/auth/get-session", {
              timeout: 10_000,
            });
            const body = res.ok() ? await res.json() : null;
            if (body) continue;
          } finally {
            await cached.dispose();
          }
        }
      } catch {
        /* no cached state — sign in below */
      }
    }
    const ctx = await request.newContext({ baseURL: BASE_URL });
    try {
      const res = await ctx.post("/api/auth/sign-in/email", {
        headers: { Origin: BASE_URL },
        data: { email: ACCOUNTS[role], password: PASSWORD },
      });
      if (!res.ok()) {
        if (role === "admin") continue; // optional when ADMIN_EMAILS differs
        if (res.status() === 429) {
          // Stale-but-valid state beats failing the whole suite on a quota.
          try {
            await stat(path);
            continue;
          } catch {
            /* fall through to the error below */
          }
        }
        throw new Error(`sign-in failed for ${role}: HTTP ${res.status()}`);
      }
      await ctx.storageState({ path: storageStateFor(role) });
    } finally {
      await ctx.dispose();
    }
  }
}
