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

/** First chat the buyer can open in the seeded data (any listing status). */
export async function firstChatForBuyer(email: string) {
  const { rows } = await getPool().query<{ id: number; title: string }>(
    `select c.id, l.title from chats c
       join listings l on l.id = c.listing_id
       join users u on u.id = c.buyer_id
      where u.email = $1
      order by c.id limit 1`,
    [email],
  );
  return rows[0] ?? null;
}

/** Reservation row for assertions; null when the listing has no deal. */
export async function dealState(listingId: number) {
  const { rows } = await getPool().query<{
    status: string;
    tx_id: number | null;
    seller_marked_at: Date | null;
    buyer_accepted_at: Date | null;
    seller_handed_over_at: Date | null;
    buyer_confirmed_at: Date | null;
  }>(
    `select l.status, t.id as tx_id, t.seller_marked_at, t.buyer_accepted_at,
            t.seller_handed_over_at, t.buyer_confirmed_at
       from listings l
       left join transactions t on t.listing_id = l.id
      where l.id = $1`,
    [listingId],
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
  const qaListings = "(select id from listings where title like 'QA E2E %')";
  // Uploads made by sell.spec land in photo_blobs (owned by seller1, not a
  // qa-e2e-* user), so clear blobs referenced by this run's listings too.
  await db.query(
    `delete from photo_blobs where id in (
       select substring(url from '/api/photos/([^/?#]+)')
         from listing_photos
        where listing_id in ${qaListings}
     )`,
  );
  // Deals and conversations hang off listings without cascade — clear them
  // before the listing itself.
  await db.query(
    `delete from ratings where transaction_id in (
       select id from transactions where listing_id in ${qaListings})`,
  );
  await db.query(`delete from notifications where listing_id in ${qaListings}`);
  await db.query(`delete from transactions where listing_id in ${qaListings}`);
  await db.query(
    `delete from messages where chat_id in (
       select id from chats where listing_id in ${qaListings})`,
  );
  await db.query(`delete from chats where listing_id in ${qaListings}`);
  await db.query("delete from listings where title like 'QA E2E %'");
  await db.query(
    "delete from photo_blobs where owner_id in (select id from users where email like 'qa-e2e-%@test.bookloop.local')",
  );
  await db.query("delete from users where email like 'qa-e2e-%@test.bookloop.local'");
}
