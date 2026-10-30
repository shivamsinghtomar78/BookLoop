// Chats tab (Task 4.8): conversation list, both roles, unread dots.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/users";
import { listMyChats } from "@/services/chat";
import { ChatList } from "@/components/chat/chat-list";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/");

  const rows = await listMyChats(current.profile.id);

  return (
    <div className="mx-auto mt-4 w-full max-w-md md:mt-8 md:max-w-lg">
      <h1 className="text-display">Chats</h1>

      {rows.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">💬</p>
          <p className="font-semibold">No chats yet</p>
          <p className="text-subtle max-w-xs text-sm">
            Find a book and tap <span className="font-medium">Chat with Seller</span> —
            no phone numbers, everything happens here.
          </p>
          <Link href="/search" className="text-primary text-sm underline-offset-4 hover:underline">
            Browse books
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <ChatList rows={rows} />
        </div>
      )}
    </div>
  );
}
