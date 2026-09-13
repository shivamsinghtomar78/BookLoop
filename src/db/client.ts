// Neon serverless HTTP driver + Drizzle (D-035).
// Each query is a stateless HTTP call — no connection pool, so exhaustion is
// structurally impossible on serverless (ARCHITECTURE.md §4).

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** Lazy accessor so builds without DATABASE_URL don't crash at import time. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — copy .env.example to .env and fill it in.",
    );
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export { schema };
