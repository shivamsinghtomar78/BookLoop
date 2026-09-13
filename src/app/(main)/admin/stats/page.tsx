// Team-only pilot metrics (Task 6.8) — straight from the tables, no analytics
// service. Access: emails listed in ADMIN_EMAILS (comma-separated env var).

import { notFound } from "next/navigation";
import { eq, isNotNull, sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  chats,
  feedback,
  listings,
  messages,
  ratings,
  transactions,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/services/users";

export const dynamic = "force-dynamic";

function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AdminStatsPage() {
  const current = await getCurrentUser();
  if (!current || !isAdmin(current.profile.email)) notFound(); // invisible to non-admins

  const db = getDb();
  const count = (q: Promise<{ n: number }[]>) => q.then((r) => r[0]?.n ?? 0);

  const [
    signups,
    confirmedUsers,
    activeListings,
    byMode,
    chatsStarted,
    messagesSent,
    closedDeals,
    donationsDone,
    thumbsGiven,
    reports,
  ] = await Promise.all([
    count(db.select({ n: dsql<number>`count(*)::int` }).from(users)),
    count(
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.emailConfirmed, true)),
    ),
    count(
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(listings)
        .where(eq(listings.status, "active")),
    ),
    db
      .select({ mode: listings.mode, n: dsql<number>`count(*)::int` })
      .from(listings)
      .where(dsql`${listings.status} != 'deleted'`)
      .groupBy(listings.mode),
    count(db.select({ n: dsql<number>`count(*)::int` }).from(chats)),
    count(db.select({ n: dsql<number>`count(*)::int` }).from(messages)),
    count(
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(transactions)
        .where(isNotNull(transactions.buyerConfirmedAt)),
    ),
    count(
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(transactions)
        .where(
          dsql`${transactions.mode} = 'donate' AND ${transactions.buyerConfirmedAt} IS NOT NULL`,
        ),
    ),
    count(
      db
        .select({ n: dsql<number>`count(*)::int` })
        .from(ratings)
        .where(eq(ratings.thumbsUp, true)),
    ),
    db.select().from(feedback).orderBy(dsql`${feedback.createdAt} DESC`).limit(20),
  ]);

  const modeMap = Object.fromEntries(byMode.map((r) => [r.mode, r.n]));

  const stats: [string, number][] = [
    ["Signups", signups],
    ["Email-confirmed", confirmedUsers],
    ["Active listings", activeListings],
    ["Listings — sell", modeMap.sell ?? 0],
    ["Listings — exchange", modeMap.exchange ?? 0],
    ["Listings — donate", modeMap.donate ?? 0],
    ["Chats started", chatsStarted],
    ["Messages sent", messagesSent],
    ["Deals completed", closedDeals],
    ["Books donated (completed)", donationsDone],
    ["👍 given", thumbsGiven],
  ];

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl">
      <h1 className="text-display">Pilot metrics</h1>
      <p className="text-subtle mt-1 text-sm">
        Live from the database — share the weekly numbers with the school contact.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, n]) => (
          <div key={label} className="rounded-2xl bg-card p-4">
            <p className="text-2xl font-bold">{n}</p>
            <p className="text-subtle text-xs">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-title-lg mt-8">Problem reports (latest 20)</h2>
      {reports.length === 0 ? (
        <p className="text-subtle mt-2 text-sm">None yet 🎉</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl bg-card p-3 text-sm">
              <p>{r.body}</p>
              <p className="text-subtle mt-1 text-xs">
                {r.page ?? "?"} ·{" "}
                {r.createdAt.toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
