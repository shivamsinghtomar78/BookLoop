// Badge count poll (Task 3.7, D-037) — one cheap indexed count every 30s
// from the app shell, only while the tab is visible.

import { getCurrentUser } from "@/services/users";
import { unreadCount } from "@/services/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return Response.json({ unread: 0 });
  const unread = await unreadCount(current.profile.id);
  return Response.json({ unread });
}
