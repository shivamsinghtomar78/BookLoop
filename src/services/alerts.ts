// Notify-me alerts (Tasks 3.5/3.6): create/deactivate alerts, and match
// new listings against active alerts on publish (synchronous — D-038).
// In-app notification row is the source of truth; email is best-effort.

import { and, desc, eq, ilike, ne, sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookAlerts, listings, notifications, users } from "@/db/schema";
import { DomainError } from "@/services/listings";
import { sendEmail } from "@/lib/email";

const MAX_ACTIVE_ALERTS = 10;

export async function createAlert(
  userId: number,
  input: {
    keyword?: string | null;
    category?: "textbook" | "reference" | "competitive" | "novel" | null;
    class?: number | null;
    subject?: string | null;
  },
) {
  if (!input.keyword && !input.category && !input.class && !input.subject)
    throw new DomainError("Pick at least one thing to watch for.");

  const db = getDb();
  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(bookAlerts)
    .where(and(eq(bookAlerts.userId, userId), eq(bookAlerts.active, true)));
  if (count >= MAX_ACTIVE_ALERTS)
    throw new DomainError(
      `You already have ${MAX_ACTIVE_ALERTS} alerts — remove one first.`,
    );

  const [alert] = await db
    .insert(bookAlerts)
    .values({
      userId,
      keyword: input.keyword || null,
      category: input.category ?? null,
      class: input.class ?? null,
      subject: input.subject || null,
    })
    .returning();
  return alert;
}

export async function deactivateAlert(userId: number, alertId: number) {
  const db = getDb();
  const [alert] = await db
    .select()
    .from(bookAlerts)
    .where(eq(bookAlerts.id, alertId))
    .limit(1);
  if (!alert || alert.userId !== userId)
    throw new DomainError("That alert doesn't exist.");
  await db
    .update(bookAlerts)
    .set({ active: false })
    .where(eq(bookAlerts.id, alertId));
}

export async function myAlerts(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(bookAlerts)
    .where(and(eq(bookAlerts.userId, userId), eq(bookAlerts.active, true)))
    .orderBy(desc(bookAlerts.createdAt));
}

/** Called from listings.createListing after publish. One indexed pass over
    active alerts; never throws (a matching failure must not fail the publish). */
export async function matchAlertsForNewListing(listingId: number) {
  try {
    const db = getDb();
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!listing) return;

    const conds = [
      eq(bookAlerts.active, true),
      ne(bookAlerts.userId, listing.sellerId), // don't notify the seller about their own book
      dsql`(${bookAlerts.keyword} IS NULL OR ${listings.title} ILIKE '%' || ${bookAlerts.keyword} || '%')`,
      dsql`(${bookAlerts.category} IS NULL OR ${bookAlerts.category} = ${listing.category})`,
      dsql`(${bookAlerts.class} IS NULL OR ${bookAlerts.class} = ${listing.class ?? -1})`,
      dsql`(${bookAlerts.subject} IS NULL OR ${listing.subject ?? ""} ILIKE '%' || ${bookAlerts.subject} || '%')`,
    ];

    const matches = await db
      .select({ alert: bookAlerts, email: users.email, name: users.fullName })
      .from(bookAlerts)
      .innerJoin(users, eq(users.id, bookAlerts.userId))
      .innerJoin(listings, eq(listings.id, listingId))
      .where(and(...conds));

    if (matches.length === 0) return;

    // Dedupe per user (multiple alerts can match one listing)
    const perUser = new Map<number, (typeof matches)[number]>();
    for (const m of matches) {
      if (!perUser.has(m.alert.userId)) perUser.set(m.alert.userId, m);
    }

    await db.insert(notifications).values(
      [...perUser.values()].map((m) => ({
        userId: m.alert.userId,
        type: "alert_match" as const,
        text: `"${listing.title}" was just listed — matches your alert`,
        listingId: listing.id,
      })),
    );

    // Best-effort emails, never blocking
    const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    for (const m of perUser.values()) {
      void sendEmail(
        m.email,
        "A book you're watching for is on BookLoop",
        `Hi ${m.name},\n\n"${listing.title}" was just listed and matches your alert.\n\nSee it: ${base}/listings/${listing.id}\n\n— BookLoop`,
      );
    }
  } catch (err) {
    console.error("[alerts] matching failed (publish unaffected)", err);
  }
}
