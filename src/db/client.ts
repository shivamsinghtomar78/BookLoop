// Drizzle client. Uses Neon's stateless HTTP driver for Neon URLs (D-035) and a
// normal pg pool for anything else (local Postgres, CI, drizzle push). The pool
// is cached on globalThis so Next dev HMR doesn't leak connections.

import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __bookloopDb?: { url: string; db: Db; pool?: Pool };
};

function isNeonHost(url: string) {
  try {
    return /\.neon\.tech$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Lazy accessor so builds without DATABASE_URL don't crash at import time. */
export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and fill it in.",
    );
  }

  const cached = globalForDb.__bookloopDb;
  if (cached?.url === url) return cached.db;

  if (cached?.pool) void cached.pool.end().catch(() => {});

  if (isNeonHost(url)) {
    const db = drizzleHttp(neon(url), { schema });
    globalForDb.__bookloopDb = { url, db };
    return db;
  }

  const pool = new Pool({ connectionString: url, max: 5 });
  const db = drizzleNode(pool, { schema }) as unknown as Db;
  globalForDb.__bookloopDb = { url, db, pool };
  return db;
}

export { schema };
