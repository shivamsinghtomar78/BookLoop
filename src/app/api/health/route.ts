// Health check — app + DB in one URL (ARCHITECTURE.md §4, Task 0.8).
// Used by the uptime pinger in Phase 6.

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: true });
  } catch {
    // Degrade, don't crash — a failing DB should read as unhealthy, not a 500 stack trace.
    return Response.json({ ok: false, db: false }, { status: 503 });
  }
}
