// Desktop two-pane shell (WhatsApp Web pattern): conversation list left, thread
// right. Phones render only the thread — the list stays at /chats.

import Link from "next/link";
import type { ReactNode } from "react";
import { ChatList } from "@/components/chat/chat-list";
import type { listMyChats } from "@/services/chat";

type ChatRow = Awaited<ReturnType<typeof listMyChats>>[number];

export function ChatShell({
  chats,
  activeChatId,
  children,
}: {
  chats: ChatRow[];
  activeChatId: number;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <aside className="border-hairline bg-card/40 hidden w-80 shrink-0 flex-col border-r lg:flex xl:w-96">
        <div className="border-hairline flex items-baseline gap-2 border-b px-4 py-3">
          <Link href="/" className="font-display text-lg font-semibold">
            BookLoop
          </Link>
          <span className="text-subtle text-xs">Chats</span>
        </div>
        <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto p-2">
          <ChatList rows={chats} activeChatId={activeChatId} compact />
        </nav>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
