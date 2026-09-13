// Notifications list (Task 3.7): deep links to the exact place; marks all
// read on open (badge clears on the next poll).

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/services/users";
import { markAllRead, myNotifications } from "@/services/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/");

  const items = await myNotifications(current.profile.id);
  // Mark-as-read on open — the list still shows unread styling for this render.
  const unreadIds = new Set(items.filter((n) => !n.readAt).map((n) => n.id));
  if (unreadIds.size > 0) await markAllRead(current.profile.id);

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg">
      <h1 className="text-display">Notifications</h1>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Bell className="text-subtle size-8" />
          <p className="font-semibold">Nothing yet</p>
          <p className="text-subtle max-w-xs text-sm">
            Alerts about books you&apos;re watching for and chat updates will
            appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {items.map((n) => {
            const inner = (
              <div
                className={`rounded-2xl p-3.5 transition ${
                  unreadIds.has(n.id) ? "bg-primary-soft" : "bg-card"
                }`}
              >
                <p className="text-sm">{n.text}</p>
                <p className="text-subtle mt-0.5 text-xs">
                  {n.createdAt.toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
            const target =
              n.type === "chat_message"
                ? "/chats"
                : n.listingId
                  ? `/listings/${n.listingId}`
                  : null;
            return (
              <li key={n.id}>
                {target ? <Link href={target}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
