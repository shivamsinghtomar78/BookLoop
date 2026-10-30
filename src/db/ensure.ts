// Idempotent bootstrap for the photo_blobs table. The app otherwise relies on
// drizzle-kit push; this keeps the upload fallback working on deployments that
// predate the table (pilot) without a manual migration step.

import { sql } from "drizzle-orm";
import { getDb } from "./client";

let ready: Promise<void> | null = null;
let txReady: Promise<void> | null = null;

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

// Reservation lifecycle v2: buyer acceptance + seller handover timestamps.
// Additive and idempotent so a live deployment gets them without manual DDL.
// The backfill runs exactly once (schema_meta marker) so reservations created
// after the deploy are not auto-accepted by a later instance boot.
export function ensureTransactionColumns() {
  if (!txReady) {
    txReady = (async () => {
      const db = getDb();
      await db.execute(sql`
        create table if not exists schema_meta (
          key text primary key,
          applied_at timestamptz not null default now()
        )
      `);
      await db.execute(sql`
        alter table transactions
          add column if not exists buyer_accepted_at timestamptz
      `);
      await db.execute(sql`
        alter table transactions
          add column if not exists seller_handed_over_at timestamptz
      `);
      await db.execute(sql`
        with marker as (
          insert into schema_meta (key) values ('tx_reservation_v2')
          on conflict (key) do nothing
          returning key
        )
        update transactions t
           set buyer_accepted_at = coalesce(t.buyer_accepted_at, t.seller_marked_at),
               seller_handed_over_at = coalesce(t.seller_handed_over_at, t.buyer_confirmed_at)
         where exists (select 1 from marker)
      `);
    })().catch((err) => {
      txReady = null; // retry on the next request
      throw err;
    });
  }
  return txReady;
}
