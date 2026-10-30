// Idempotent bootstrap for the photo_blobs table. The app otherwise relies on
// drizzle-kit push; this keeps the upload fallback working on deployments that
// predate the table (pilot) without a manual migration step.

import { sql } from "drizzle-orm";
import { getDb } from "./client";

let ready: Promise<void> | null = null;

export function ensurePhotoBlobTable() {
  if (!ready) {
    ready = (async () => {
      const db = getDb();
      await db.execute(sql`
        create table if not exists photo_blobs (
          id text primary key,
          owner_id integer not null references users(id) on delete cascade,
          mime text not null,
          data text not null,
          created_at timestamptz not null default now()
        )
      `);
      await db.execute(sql`
        create index if not exists photo_blobs_owner_idx
          on photo_blobs (owner_id, created_at)
      `);
    })().catch((err) => {
      ready = null; // retry on the next request
      throw err;
    });
  }
  return ready;
}
