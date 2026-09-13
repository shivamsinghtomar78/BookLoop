// Notifications service (Task 3.7) — badge count, list, mark-as-read.

import { and, desc, eq, isNull } from "drizzle-orm";
import { sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { notifications } from "@/db/schema";

export async function unreadCount(userId: number): Promise<number> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: dsql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return count;
}

export async function myNotifications(userId: number, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markAllRead(userId: number) {
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
