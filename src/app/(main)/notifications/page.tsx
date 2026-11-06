// Notifications list (Task 3.7): deep links to the exact place; marks all
// read on open (badge clears on the next poll).

import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, MessageCircle, Sparkle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/services/users";
import { markAllRead, myNotifications } from "@/services/notifications";

export const dynamic = "force-dynamic";

const TYPE_ICON = {
  alert_match: Sparkle,
  chat_message: MessageCircle,
  confirm_handover: CheckCircle2,
} as const;

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
      {items.length > 0 && (
        <p className="text-subtle mt-1 text-sm">
          {unreadIds.size > 0
            ? `${unreadIds.size} new — now marked as read.`
            : "You’re all caught up."}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing yet"
          description="Alerts about books you're watching for and chat updates will appear here."
          className="mt-16"
        >
          <Link
            href="/search"
            className="bg-primary text-primary-foreground hover:bg-primary-active inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition"
          >
            Search books
          </Link>
        </EmptyState>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {items.map((n) => {
            const Icon = TYPE_ICON[n.type] ?? Bell;
            const unread = unreadIds.has(n.id);
            const inner = (
              <div
                className={`flex gap-3 rounded-2xl p-3.5 transition ${
                  unread ? "bg-primary-soft" : "bg-card"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    unread
                      ? "bg-card text-primary"
                      : "bg-surface-soft text-subtle"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{n.text}</p>
                  <p className="text-subtle mt-1 flex items-center gap-1.5 text-xs">
                    <time dateTime={n.createdAt.toISOString()}>
                      {n.createdAt.toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                    {unread && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-primary font-medium">New</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
            const target =
              n.type === "chat_message" || n.type === "confirm_handover"
                ? n.chatId
                  ? `/chats/${n.chatId}`
                  : "/chats"
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
