#!/usr/bin/env node
// Remove only the accounts and rows created by E2E runs (default: e2e-*@example.com).
// Runs inside one transaction on the guarded test branch. Safe to re-run.
//
//   node scripts/e2e-cleanup.mjs [--email-like 'e2e-ab12-%@example.com'] [--quiet]
//
// Imported by Playwright globalTeardown and the legacy negotiation script.

import { pathToFileURL } from "node:url";
import { assertTestDb } from "./lib/test-db.mjs";

const DEFAULT_LIKE = "e2e-%@example.com";

export async function cleanupE2eData(pool, { emailLike = DEFAULT_LIKE } = {}) {
  if (!/^[a-z0-9%@._-]+$/i.test(emailLike)) {
    throw new Error("emailLike must be a plain LIKE pattern (no quotes or wildcards beyond %).");
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    const { rows } = await client.query(
      "select id, auth_id from users where email like $1",
      [emailLike],
    );
    if (rows.length === 0) {
      await client.query("commit");
      return { users: 0, listings: 0, transactions: 0 };
    }

    const ids = rows.map((r) => r.id);
    const authIds = rows.map((r) => r.authId ?? r.auth_id);
    const listingIds = `select id from listings where seller_id = any($1)`;
    const txIds = `select t.id from transactions t
                     where t.buyer_id = any($1) or t.listing_id in (${listingIds})`;
    const chatIds = `select c.id from chats c
                       where c.buyer_id = any($1) or c.listing_id in (${listingIds})`;

    await client.query(
      `delete from ratings where rater_id = any($1) or ratee_id = any($1)
          or transaction_id in (${txIds})`,
      [ids],
    );
    await client.query("delete from feedback where user_id = any($1)", [ids]);
    await client.query("delete from notifications where user_id = any($1)", [ids]);
    await client.query(`delete from messages where chat_id in (${chatIds})`, [ids]);
    const tx = await client.query(
      `delete from transactions where buyer_id = any($1) or listing_id in (${listingIds})`,
      [ids],
    );
    await client.query(
      `delete from chats where buyer_id = any($1) or listing_id in (${listingIds})`,
      [ids],
    );
    await client.query("delete from wishlist_items where user_id = any($1)", [ids]);
    await client.query("delete from book_alerts where user_id = any($1)", [ids]);
    const listings = await client.query("delete from listings where seller_id = any($1)", [ids]);
    await client.query("delete from users where id = any($1)", [ids]);
    await client.query("delete from session where user_id = any($1)", [authIds]);
    await client.query("delete from account where user_id = any($1)", [authIds]);
    await client.query('delete from "user" where id = any($1)', [authIds]);

    await client.query("commit");
    return {
      users: ids.length,
      listings: listings.rowCount ?? 0,
      transactions: tx.rowCount ?? 0,
    };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const likeIndex = argv.indexOf("--email-like");
  const emailLike = likeIndex >= 0 ? argv[likeIndex + 1] : DEFAULT_LIKE;
  const quiet = argv.includes("--quiet");

  const cfg = await assertTestDb({ quiet: true });
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: cfg.unpooled, max: 1 });
  try {
    const result = await cleanupE2eData(pool, { emailLike });
    if (!quiet) {
      console.log(
        `✓ cleanup on ${cfg.maskedHost}: ${result.users} user(s), ${result.listings} listing(s), ${result.transactions} transaction(s) removed`,
      );
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\nCleanup failed: ${err.message}\n`);
    process.exit(1);
  });
}
