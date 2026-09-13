// pg_notify bridge to the socket.io server (D-055). Server actions call this
// after each chat write; the realtime server LISTENs and pushes to the room.
// Best-effort: if it fails, clients still get the data via polling fallback.

import { sql as dsql } from "drizzle-orm";
import { getDb } from "@/db/client";

export async function notifyChatEvent(event: {
  kind: "message" | "state";
  chatId: number;
  message?: unknown;
}) {
  try {
    await getDb().execute(
      dsql`SELECT pg_notify('chat_events', ${JSON.stringify(event)})`,
    );
  } catch (err) {
    console.error("[realtime] notify failed (polling covers it)", err);
  }
}
