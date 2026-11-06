// Conversation rows shared by the /chats page and the desktop two-pane aside.

import Image from "next/image";
import Link from "next/link";
import type { listMyChats } from "@/services/chat";
import { cn } from "@/lib/utils";

type ChatRow = Awaited<ReturnType<typeof listMyChats>>[number];

const TIME_ZONE = "Asia/Kolkata";

function when(d: Date) {
  const now = new Date();
  const day = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  if (day(d) === day(now)) {
    return d.toLocaleTimeString("en-IN", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (day(d) === day(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
  });
}

export function ChatList({
  rows,
  activeChatId,
  compact = false,
}: {
  rows: ChatRow[];
  activeChatId?: number;
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className={cn("text-subtle text-sm", compact ? "px-2 py-6" : "py-8 text-center")}>
        No conversations here yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((c) => {
        const active = c.chatId === activeChatId;
        return (
          <li key={c.chatId}>
            <Link
              href={`/chats/${c.chatId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 p-2.5 transition",
                compact ? "rounded-xl" : "rounded-2xl",
                active
                  ? "bg-primary-soft/70 ring-primary/10 ring-1"
                  : c.unread
                    ? "bg-primary-soft/35 hover:bg-primary-soft/60"
                    : "bg-card hover:bg-surface-soft",
              )}
            >
              <span className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-xl">
                {c.photoUrl && (
                  <Image
                    src={c.photoUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-ink truncate text-sm font-semibold">
                    {c.title}
                  </span>
                  <time
                    dateTime={c.lastAt.toISOString()}
                    className="text-subtle shrink-0 text-[10px] leading-none"
                  >
                    {when(c.lastAt)}
                  </time>
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "block min-w-0 flex-1 truncate text-xs",
                      c.unread ? "text-body font-medium" : "text-subtle",
                    )}
                  >
                    <span className="text-body/80">{c.otherName}</span>
                    {c.lastMessage ? `: ${c.lastMessage}` : " — say hi!"}
                  </span>
                  {c.status !== "active" && (
                    <span className="border-hairline text-subtle shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                      {c.status === "reserved" ? "Reserved" : c.status}
                    </span>
                  )}
                  {c.unread && (
                    <span
                      className="bg-primary size-2 shrink-0 rounded-full"
                      aria-label="Unread messages"
                    />
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
