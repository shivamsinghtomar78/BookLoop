// Conversation rows shared by the /chats page and the desktop two-pane aside.

import Image from "next/image";
import Link from "next/link";
import type { listMyChats } from "@/services/chat";
import { cn } from "@/lib/utils";

type ChatRow = Awaited<ReturnType<typeof listMyChats>>[number];

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
      <p className={cn("text-subtle text-sm", compact ? "px-2 py-6" : "mt-8 text-center")}>
        No chats yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((c) => {
        const active = c.chatId === activeChatId;
        return (
          <li key={c.chatId}>
            <Link
              href={`/chats/${c.chatId}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 p-3 transition",
                compact ? "rounded-xl" : "rounded-2xl",
                active ? "bg-primary-soft" : "bg-card hover:bg-surface-soft",
              )}
            >
              <span className="bg-surface-soft relative size-12 shrink-0 overflow-hidden rounded-lg">
                {c.photoUrl && (
                  <Image src={c.photoUrl} alt={c.title} fill sizes="48px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{c.title}</span>
                  {c.status !== "active" && (
                    <span className="text-subtle shrink-0 text-[10px] uppercase">
                      {c.status}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    c.unread ? "text-foreground font-medium" : "text-subtle",
                  )}
                >
                  {c.otherName}
                  {c.lastMessage ? `: ${c.lastMessage}` : " — say hi!"}
                </span>
              </span>
              {c.unread && (
                <span
                  className="bg-primary size-2.5 shrink-0 rounded-full"
                  aria-label="Unread messages"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
