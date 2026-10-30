"use client";

// Bell + unread badge (Task 3.7): 30s poll, only while the tab is visible
// (D-037 — polling is the scarce resource). Hidden for guests.

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) setUnread((await res.json()).unread ?? 0);
      } catch {
        /* transient network failure — next poll retries */
      }
    }

    void poll();
    timer = setInterval(poll, 30_000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [session]);

  if (!session) return null;

  return (
    <div className="relative">
      <Link
        href="/notifications"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition md:size-9",
          dark
            ? "text-white/65 hover:bg-white/10 hover:text-white"
            : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
        )}
        onClick={() => setUnread(0)}
      >
        <Bell className="size-5" />
      </Link>
      {/* Badge sits outside the link so the link keeps a clean text alternative. */}
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground pointer-events-none absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </div>
  );
}
