// Public impact counters for the hero — real numbers, no vanity metrics.

import { and, eq, isNotNull, sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { listings, transactions, users } from "@/db/schema";

export type ImpactStats = {
  books: number;
  students: number;
  rehomed: number;
  donations: number;
};

export async function getImpactStats(): Promise<ImpactStats> {
  const db = getDb();
  const n = dsql<number>`count(*)::int`;

  const [books, students, rehomed, donations] = await Promise.all([
    db
      .select({ n })
      .from(listings)
      .where(eq(listings.status, "active")),
    db.select({ n }).from(users),
    db
      .select({ n })
      .from(transactions)
      .where(isNotNull(transactions.buyerConfirmedAt)),
    db
      .select({ n })
      .from(listings)
      .where(and(eq(listings.status, "active"), eq(listings.mode, "donate"))),
  ]);

  return {
    books: books[0]?.n ?? 0,
    students: students[0]?.n ?? 0,
    rehomed: rehomed[0]?.n ?? 0,
    donations: donations[0]?.n ?? 0,
  };
}
