// Read-only assertions and scoped cleanup against the QA database. Any URL
// that resolves to Neon is rejected outright — the suite never touches prod.

import { Pool } from "pg";
import { DB_URL } from "./env";

let pool: Pool | null = null;

export function isNeon(url: string) {
  try {
    return /\.neon\.tech$/i.test(new URL(url).hostname);
  } catch {
    return true;
  }
}

export function getPool(): Pool {
  if (isNeon(DB_URL)) {
    throw new Error(
      "QA_DATABASE_URL points at Neon. This suite only runs against a disposable local/staging database.",
    );
  }
  pool ??= new Pool({ connectionString: DB_URL, max: 2 });
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
  }
}

export async function firstListing(mode?: "sell" | "exchange" | "donate") {
  const where = mode ? "and mode = $1" : "";
  const { rows } = await getPool().query<{ id: number; title: string; seller_id: number }>(
    `select id, title, seller_id from listings where status = 'active' ${where} order by id limit 1`,
    mode ? [mode] : [],
  );
  return rows[0] ?? null;
}

export async function firstListingBySeller(email: string) {
  const { rows } = await getPool().query<{ id: number; title: string; seller_id: number }>(
    `select l.id, l.title, l.seller_id from listings l
       join users u on u.id = l.seller_id
      where l.status = 'active' and u.email = $1
      order by l.id limit 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function listingByTitle(title: string) {
  const { rows } = await getPool().query<{ id: number; status: string }>(
    "select id, status from listings where title = $1 order by id desc limit 1",
    [title],
  );
  return rows[0] ?? null;
}

/** Remove only rows this suite created (titles and emails are tagged). */
export async function cleanupRun() {
  const db = getPool();
  // Uploads made by sell.spec land in photo_blobs (owned by seller1, not a
  // qa-e2e-* user), so clear blobs referenced by this run's listings too.
  await db.query(
    `delete from photo_blobs where id in (
       select substring(url from '/api/photos/([^/?#]+)')
         from listing_photos
        where listing_id in (select id from listings where title like 'QA E2E %')
     )`,
  );
  await db.query("delete from listings where title like 'QA E2E %'");
  await db.query(
    "delete from photo_blobs where owner_id in (select id from users where email like 'qa-e2e-%@test.bookloop.local')",
  );
  await db.query("delete from users where email like 'qa-e2e-%@test.bookloop.local'");
}
